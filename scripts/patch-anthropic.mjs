import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const targetFile = process.argv[2] || "packages/backend/src/providers/llm.ts";
const fullPath = path.resolve(targetFile);

console.log(`[Patch] Patching ${fullPath} for Anthropic Messages API support...`);
let raw = readFileSync(fullPath, "utf8");
const isCrlf = raw.includes("\r\n");
let content = raw.replace(/\r\n/g, "\n");

if (content.includes("isAnthropic")) {
  console.log("[Patch] Anthropic support already present, skipping.");
  process.exit(0);
}

// 1. Target block for request and body
const originalTarget = `  const { request, temperature, maxTokens, userText } = requestFor(opts, spec);
  const timeoutMs = opts.timeoutMs ?? (circuit ? FAILOVER_TIMEOUT_MS : TIMEOUT_MS);
  let permit: CircuitPermit;
  const body: Record<string, unknown> = {
    model: spec.model,
    messages: [
      // A prompt given as one user message (the title/summary prompts) has no system message.
      ...(opts.system ? [{ role: "system", content: opts.system }] : []),
      // Multimodal parts go through as parts; plain objects are sent as JSON text.
      { role: "user", content: typeof opts.user === "string" || Array.isArray(opts.user) ? opts.user : userText },
    ],
    temperature,
    max_tokens: maxTokens,
    ...(spec.jsonMode && opts.json !== false ? { response_format: { type: "json_object" } } : {}),
    ...(spec.extra ?? {}),
  };`;

const patchedTarget = `  const { request, temperature, maxTokens, userText } = requestFor(opts, spec);
  const timeoutMs = opts.timeoutMs ?? (circuit ? FAILOVER_TIMEOUT_MS : TIMEOUT_MS);
  let permit: CircuitPermit;

  const isAnthropic = baseUrl.includes("anthropic.com") || process.env.LLM_PROVIDER === "anthropic";
  const url = isAnthropic
    ? (baseUrl.endsWith("/v1") ? \`\${baseUrl}/messages\` : \`\${baseUrl.replace(/\\/$/, "")}/v1/messages\`)
    : \`\${baseUrl.replace(/\\/$/, "")}/chat/completions\`;
  const headers: Record<string, string> = isAnthropic
    ? { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
    : { "content-type": "application/json", authorization: \`Bearer \${apiKey}\` };

  const body: Record<string, unknown> = isAnthropic
    ? {
        model: spec.model,
        max_tokens: maxTokens,
        temperature: Math.min(Math.max(temperature, 0), 1),
        ...(opts.system ? { system: opts.system } : {}),
        messages: [{ role: "user", content: typeof opts.user === "string" ? opts.user : userText }],
        ...(spec.extra ?? {}),
      }
    : {
        model: spec.model,
        messages: [
          ...(opts.system ? [{ role: "system", content: opts.system }] : []),
          { role: "user", content: typeof opts.user === "string" || Array.isArray(opts.user) ? opts.user : userText },
        ],
        temperature,
        max_tokens: maxTokens,
        ...(spec.jsonMode && opts.json !== false ? { response_format: { type: "json_object" } } : {}),
        ...(spec.extra ?? {}),
      };`;

// 2. Fetch call replacement
const originalFetch = `        res = await fetch(\`\${baseUrl.replace(/\\/$/, "")}/chat/completions\`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: \`Bearer \${apiKey}\` },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });`;

const patchedFetch = `        res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });`;

// 3. Normalize JSON response
const originalJsonParse = `      let json: Record<string, unknown>;
      try {
        json = JSON.parse(text);
        if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("Expected a response object");
      } catch {
        json = { unparsable: text.slice(0, 20000) };
      }`;

const patchedJsonParse = `      let json: Record<string, unknown>;
      try {
        json = JSON.parse(text);
        if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("Expected a response object");
        if (isAnthropic && Array.isArray((json as any).content)) {
          const textContent = ((json as any).content as Array<{ type: string; text?: string }>)
            .filter((c: any) => c.type === "text" && c.text)
            .map((c: any) => c.text)
            .join("");
          (json as any).choices = [
            {
              message: { content: textContent },
              finish_reason: (json as any).stop_reason === "max_tokens" ? "length" : (json as any).stop_reason,
            }
          ];
          const usage = (json as any).usage as { input_tokens?: number; output_tokens?: number } | undefined;
          if (usage) {
            (json as any).usage = {
              prompt_tokens: usage.input_tokens ?? 0,
              completion_tokens: usage.output_tokens ?? 0,
            };
          }
        }
      } catch {
        json = { unparsable: text.slice(0, 20000) };
      }`;

if (!content.includes(originalTarget)) {
  console.error("[Patch Error] Could not find original target block in llm.ts");
  process.exit(1);
}
content = content.replace(originalTarget, patchedTarget);
content = content.replace(originalFetch, patchedFetch);
content = content.replace(originalJsonParse, patchedJsonParse);

if (isCrlf) {
  content = content.replace(/\n/g, "\r\n");
}

writeFileSync(fullPath, content, "utf8");
console.log("[Patch] Successfully patched llm.ts for Anthropic Messages API!");
