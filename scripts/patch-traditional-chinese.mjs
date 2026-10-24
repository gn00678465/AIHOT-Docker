import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.argv[2] || ".";
const srcRoot = path.resolve(rootDir);

console.log(`[Patch-TC] Patching for Full Traditional Chinese (Zero Token Cost Engine) in ${srcRoot}...`);

function patchFile(relPath, transform) {
  const filePath = path.join(srcRoot, relPath);
  if (!existsSync(filePath)) {
    console.warn(`[Patch-TC] Skipping missing file: ${relPath}`);
    return;
  }
  const raw = readFileSync(filePath, "utf8");
  const isCrlf = raw.includes("\r\n");
  let content = raw.replace(/\r\n/g, "\n");
  const updated = transform(content);
  if (updated !== content) {
    writeFileSync(filePath, isCrlf ? updated.replace(/\n/g, "\r\n") : updated, "utf8");
    console.log(`[Patch-TC] Successfully patched ${relPath}`);
  } else {
    console.log(`[Patch-TC] No changes needed for ${relPath}`);
  }
}

// 1. Prompts 提示詞庫全面繁體化（確保新產出內容為繁體）
patchFile("industry/prompts/content-understanding.md", (content) => {
  if (content.includes("繁體中文規範")) return content;
  const target = "## 中文标题和摘要";
  const addition = `## 中文標題和摘要（繁體中文規範）\n\n【強制語言規範】：所有輸出的文字內容（包括 titleZh、summaryZh、editorialJudgment）必須一律使用標準繁體中文（台灣繁體習慣，例如「伺服器」、「資訊」、「網路」、「演算法」、「智慧體」等），嚴禁使用簡體字。無論原文是英文、簡體中文或其他語言，標題、摘要與推薦理由均必須轉換/撰寫為繁體中文。\n`;
  return content.replace(target, addition);
});

patchFile("industry/prompts/summarize-article.md", (content) => {
  if (content.includes("繁體中文規範")) return content;
  return `【強制語言規範】：title_zh 與 summary_zh 必須一律使用標準繁體中文（台灣習慣用語）輸出，嚴禁使用簡體中文。\n\n` + content;
});

patchFile("industry/prompts/summarize-long-post.md", (content) => {
  if (content.includes("繁體中文規範")) return content;
  return `【強制語言規範】：標題與摘要必須一律使用標準繁體中文（台灣習慣用語）輸出，嚴禁使用簡體中文。\n\n` + content;
});

patchFile("industry/prompts/summarize-short-post.md", (content) => {
  if (content.includes("繁體中文規範")) return content;
  return content.replace("将以下推文翻译为中文", "將以下推文翻譯為繁體中文（台灣習慣用語，嚴禁簡體字）");
});

patchFile("industry/prompts/translate-body.md", (content) => {
  return content.replace(/翻译成简体中文/g, "翻譯成繁體中文（台灣科技用語習慣，嚴禁簡體字）");
});

patchFile("industry/prompts/translate-post.md", (content) => {
  return content.replace(/翻译成简体中文/g, "翻譯成繁體中文（台灣科技用語習慣，嚴禁簡體字）");
});

patchFile("industry/prompts/story-digest.md", (content) => {
  if (content.includes("繁體中文規範")) return content;
  return `【強制語言規範】：事件綜述與背景分析必須一律使用標準繁體中文（台灣慣用語）撰寫，嚴禁使用簡體中文。\n\n` + content;
});

patchFile("industry/prompts/report-period.md", (content) => {
  if (content.includes("繁體中文規範")) return content;
  return `【強制語言規範】：總述（overview）與分節導讀必須一律使用標準繁體中文（台灣科技習慣用語）撰寫，嚴禁使用簡體中文。\n\n` + content;
});

// 2. 站點基本配置改為 zh-TW
patchFile("site/site.ts", (content) => {
  return content.replace(/locale:\s*"zh-CN"/g, 'locale: "zh-TW"');
});

// 3. 下載離線 OpenCC 字典檔與動態繁體化引擎（零 Token 消耗）
const publicDir = path.join(srcRoot, "apps/web/public");
mkdirSync(publicDir, { recursive: true });

console.log("[Patch-TC] Downloading OpenCC bundle for zero-token browser conversion...");
try {
  execSync(`curl -sL https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js -o "${path.join(publicDir, "opencc.js")}"`, { stdio: "inherit" });
  console.log("[Patch-TC] Downloaded opencc.js successfully.");
} catch (err) {
  console.error("[Patch-TC] Failed to download opencc.js:", err);
}

// 建立前端即時自動翻譯腳本
const autotranslateScript = `(function() {
  function init() {
    if (typeof OpenCC === 'undefined') return setTimeout(init, 50);
    var converter = OpenCC.Converter({ from: 'cn', to: 'twp' });
    function convert(root) {
      if (!root) return;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        if (node.parentElement && ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(node.parentElement.tagName)) continue;
        if (node.nodeValue && /[\\u4e00-\\u9fa5]/.test(node.nodeValue)) {
          node.nodeValue = converter(node.nodeValue);
        }
      }
    }
    convert(document.body);
    if (document.title && /[\\u4e00-\\u9fa5]/.test(document.title)) {
      document.title = converter(document.title);
    }
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var node = m.addedNodes[j];
          if (node.nodeType === 3) {
            if (/[\\u4e00-\\u9fa5]/.test(node.nodeValue)) node.nodeValue = converter(node.nodeValue);
          } else if (node.nodeType === 1) {
            convert(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
writeFileSync(path.join(publicDir, "tw-autotranslate.js"), autotranslateScript, "utf8");
console.log("[Patch-TC] Created tw-autotranslate.js successfully.");

// 4. 在 apps/web/app/root.tsx 中引入轉換腳本
patchFile("apps/web/app/root.tsx", (content) => {
  if (content.includes("tw-autotranslate.js")) return content;
  const target = `<script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />`;
  const addition = `${target}\n        <script src="/opencc.js" defer></script>\n        <script src="/tw-autotranslate.js" defer></script>`;
  return content.replace(target, addition);
});

console.log("[Patch-TC] Zero-Token Full Traditional Chinese patch completed successfully!");
