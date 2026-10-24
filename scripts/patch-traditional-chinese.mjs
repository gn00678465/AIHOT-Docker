import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const rootDir = process.argv[2] || ".";
const srcRoot = path.resolve(rootDir);

console.log(`[Patch-TC] Patching for Full Traditional Chinese (Prompts + UI) in ${srcRoot}...`);

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

// ==========================================
// 1. Prompts 提示詞庫全面繁體化（層面 1）
// ==========================================
patchFile("industry/prompts/content-understanding.md", (content) => {
  if (content.includes("繁體中文規範")) return content;
  const target = "## 中文标题和摘要";
  const addition = `## 中文標題和摘要（繁體中文規範）\n\n【強制語言規範】：所有輸出的文字內容（包括 titleZh、summaryZh、editorialJudgment）必須一律使用標準繁體中文（台灣繁體習慣，例如「伺服器」、「資訊」、「網路」、「演算法」、「智能體/智慧體」等），嚴禁使用簡體字。無論原文是英文、簡體中文或其他語言，標題、摘要與推薦理由均必須轉換/撰寫為繁體中文。\n`;
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

// ==========================================
// 2. 站點設定與語言標籤繁體化（層面 2）
// ==========================================
patchFile("site/site.ts", (content) => {
  let res = content;
  // 語言標記由 zh-CN 改為 zh-TW
  res = res.replace(/locale:\s*"zh-CN"/g, 'locale: "zh-TW"');
  // 常用文案繁體化
  res = res.replace(/homeTitle:\s*"([^"]+)"/g, 'homeTitle: "MyHOT — AI 產業動態 · 每日精選與日報"');
  res = res.replace(/topicsTitle:\s*"([^"]+)"/g, 'topicsTitle: "AI 主題：公司與模型、技術方向、內容形態的最新動態"');
  res = res.replace(/tagline:\s*"([^"]+)"/g, 'tagline: "值得關注的 AI 動態"');
  res = res.replace(/feedbackLead:\s*"([^"]+)"/g, 'feedbackLead: "發現 bug、想要的功能、看不順眼的地方，都可以告訴我們。"');
  res = res.replace(/feedbackEmailHint:\s*"([^"]+)"/g, 'feedbackEmailHint: "留下 Email，我們可以回信聯繫您"');
  res = res.replace(/footerNote:\s*"([^"]+)"/g, 'footerNote: "由 AIHOT 開源框架驅動"');
  res = res.replace(/reasonLabel:\s*"推荐理由"/g, 'reasonLabel: "推薦理由"');
  res = res.replace(/"AI 资讯"/g, '"AI 資訊"');
  res = res.replace(/"AI 行业动态"/g, '"AI 產業動態"');
  res = res.replace(/entry:\s*"件大事"/g, 'entry: "件大事"');
  return res;
});

// ==========================================
// 3. 分類標籤 taxonomy.ts 繁體化（層面 2）
// ==========================================
patchFile("industry/taxonomy.ts", (content) => {
  let res = content;
  res = res.replace(/label:\s*"模型发布"/g, 'label: "模型發布"');
  res = res.replace(/label:\s*"产品更新"/g, 'label: "產品更新"');
  res = res.replace(/label:\s*"开源\/仓库"/g, 'label: "開源/專案庫"');
  res = res.replace(/label:\s*"论文\/研究"/g, 'label: "論文/研究"');
  res = res.replace(/label:\s*"教程\/实践"/g, 'label: "教學/實踐"');
  res = res.replace(/label:\s*"大佬观点"/g, 'label: "專家觀點"');
  res = res.replace(/label:\s*"评测\/基准"/g, 'label: "評測/基準"');
  res = res.replace(/label:\s*"安全\/对齐"/g, 'label: "安全/對齊"');
  res = res.replace(/label:\s*"现象\/趋势"/g, 'label: "現象/趨勢"');
  res = res.replace(/label:\s*"行业动态"/g, 'label: "產業動態"');
  res = res.replace(/label:\s*"政策\/监管"/g, 'label: "政策/監管"');
  return res;
});

// ==========================================
// 4. 前端導航 nav.ts 繁體化（層面 2）
// ==========================================
patchFile("apps/web/app/components/shell/nav.ts", (content) => {
  let res = content;
  res = res.replace(/title:\s*"内容"/g, 'title: "內容"');
  res = res.replace(/title:\s*"更多"/g, 'title: "更多"');
  res = res.replace(/label:\s*"精选"/g, 'label: "精選"');
  res = res.replace(/label:\s*subjectAfter\("全部",\s*"动态"\)/g, 'label: subjectAfter("全部", "動態")');
  res = res.replace(/label:\s*"热点榜"/g, 'label: "熱門榜"');
  res = res.replace(/label:\s*withSubject\("日报"\)/g, 'label: withSubject("日報")');
  res = res.replace(/label:\s*"主题"/g, 'label: "主題"');
  res = res.replace(/label:\s*"收藏"/g, 'label: "收藏"');
  res = res.replace(/label:\s*"Agent 接入"/g, 'label: "Agent 串接"');
  res = res.replace(/label:\s*"关于"/g, 'label: "關於"');
  res = res.replace(/label:\s*"更新日志"/g, 'label: "更新日誌"');
  res = res.replace(/label:\s*"反馈"/g, 'label: "意見回饋"');
  res = res.replace(/name:\s*"热点榜"/g, 'name: "熱門榜"');
  res = res.replace(/back:\s*"热点"/g, 'back: "熱門"');
  res = res.replace(/back:\s*"全部主题"/g, 'back: "全部主題"');
  return res;
});

console.log("[Patch-TC] Full Traditional Chinese patch applied successfully!");
