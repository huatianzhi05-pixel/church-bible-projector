/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 一键导出 U 盘离线备份包工具 (offlineBackupExporter.ts)
 * 生成无需服务器、双击即可在任何电脑浏览器打开并全屏投影的独立离线 HTML 文件
 */

import { BIBLE_BOOKS, SermonScriptureItem, VersionId } from './bibleReference';

interface RawBibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

export function exportStandaloneUsbBackup(params: {
  bookIndex: number;
  chapter: number;
  selectedVerses: number[];
  sermonList: SermonScriptureItem[];
  bibleData: Partial<Record<VersionId, RawBibleBook[]>>;
}) {
  const { bookIndex, chapter, sermonList, bibleData } = params;

  // 提取当前章与讲道清单所涉及的所有章节经文，打包进独立 HTML，保证体积轻巧且秒开
  const targetChaptersMap = new Map<string, { bookIndex: number; chapter: number }>();
  targetChaptersMap.set(`${bookIndex}-${chapter}`, { bookIndex, chapter });

  for (const item of sermonList) {
    targetChaptersMap.set(`${item.bookIndex}-${item.chapter}`, {
      bookIndex: item.bookIndex,
      chapter: item.chapter,
    });
  }

  // 同时默认附带常用核心章（创1、诗23、约3、罗8）
  [
    { bookIndex: 0, chapter: 1 },
    { bookIndex: 18, chapter: 23 },
    { bookIndex: 42, chapter: 3 },
    { bookIndex: 44, chapter: 8 },
  ].forEach((c) => targetChaptersMap.set(`${c.bookIndex}-${c.chapter}`, c));

  const bundledPassages: Array<{
    key: string;
    titleZh: string;
    titleEn: string;
    titleId: string;
    chapter: number;
    verses: Array<{ v: number; cuv: string; kjv: string; id_tl: string }>;
  }> = [];

  for (const [key, { bookIndex: bIdx, chapter: chNum }] of targetChaptersMap.entries()) {
    const meta = BIBLE_BOOKS[bIdx] || BIBLE_BOOKS[0];
    const cuvArr = bibleData.cuv?.[bIdx]?.chapters?.[chNum - 1] || [];
    const kjvArr = bibleData.kjv?.[bIdx]?.chapters?.[chNum - 1] || [];
    const idArr = bibleData.id_tl?.[bIdx]?.chapters?.[chNum - 1] || [];
    const maxLen = Math.max(cuvArr.length, kjvArr.length, idArr.length);

    const verses = [];
    for (let i = 0; i < maxLen; i++) {
      verses.push({
        v: i + 1,
        cuv: cuvArr[i] || '',
        kjv: kjvArr[i] || '',
        id_tl: idArr[i] || '',
      });
    }

    bundledPassages.push({
      key,
      titleZh: `${meta.nameZh} 第 ${chNum} 章`,
      titleEn: `${meta.nameEn.trim()} ${chNum}`,
      titleId: `${meta.nameId} ${chNum}`,
      chapter: chNum,
      verses,
    });
  }

  const htmlContent = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>微读圣经 · 主日U盘离线应急投影包</title>
<style>
  :root { --bg: #FBF9F5; --text: #1C1917; --accent: #B45309; }
  body { margin: 0; font-family: "Noto Serif SC", "Songti SC", "SimSun", serif; background: var(--bg); color: var(--text); line-height: 1.8; }
  header { position: sticky; top: 0; background: #F7F4EE; border-bottom: 1px solid #E7E5E4; padding: 12px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  select, button { font-size: 14px; padding: 8px 14px; border-radius: 8px; border: 1px solid #D6D3D1; background: #fff; cursor: pointer; }
  button.primary { background: #1C1917; color: #fff; border-color: #1C1917; font-weight: 600; }
  main { max-width: 960px; margin: 0 auto; padding: 32px 20px; }
  .verse { padding: 12px 16px; border-radius: 10px; cursor: pointer; margin-bottom: 6px; border: 1px solid transparent; }
  .verse:hover { background: rgba(0,0,0,0.03); }
  .verse.active { background: rgba(180,83,9,0.1); border-color: rgba(180,83,9,0.4); }
  .v-num { font-weight: bold; color: var(--accent); margin-right: 8px; font-family: sans-serif; }
  .en { font-family: Georgia, serif; color: #44403C; margin-top: 4px; }
  #projector { position: fixed; inset: 0; background: #000; color: #fff; display: none; flex-direction: column; justify-content: space-between; padding: 32px 48px; z-index: 999; }
  #projector.open { display: flex; }
  #proj-body { font-size: 40px; line-height: 1.6; max-width: 1200px; margin: auto; }
  #proj-watermark { position: fixed; bottom: 64px; right: 48px; color: rgba(255,255,255,0.28); font-size: 16px; }
</style>
</head>
<body>
<header>
  <div>
    <strong>微读圣经 · U盘离线应急版</strong>
    <select id="passage-select" aria-label="选择已备份经文"></select>
  </div>
  <div>
    <button class="primary" onclick="openProjector()">进入全屏黑底投影模式</button>
  </div>
</header>
<main>
  <h1 id="title"></h1>
  <div id="list"></div>
</main>
<div id="projector" onclick="stepVerse(1)">
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <strong id="proj-title" style="color:#FBBF24;font-size:24px;"></strong>
    <button onclick="event.stopPropagation();closeProjector()">退出投影 (Esc)</button>
  </div>
  <div id="proj-body"></div>
  <div id="proj-watermark"></div>
  <div style="display:flex;justify-content:space-between;color:#A8A29E;font-size:14px;">
    <button onclick="event.stopPropagation();stepVerse(-1)">← 上一节</button>
    <span>按键盘 ← → 方向键、空格或点击屏幕翻节</span>
    <button onclick="event.stopPropagation();stepVerse(1)">下一节 →</button>
  </div>
</div>
<script>
const PASSAGES = ${JSON.stringify(bundledPassages)};
let curIdx = 0;
let curVerse = 1;
const sel = document.getElementById('passage-select');
PASSAGES.forEach((p, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = p.titleZh + ' (' + p.titleEn + ')';
  sel.appendChild(opt);
});
sel.onchange = () => { curIdx = Number(sel.value); curVerse = 1; render(); };
function render() {
  const p = PASSAGES[curIdx];
  document.getElementById('title').textContent = p.titleZh + ' · ' + p.titleEn;
  const list = document.getElementById('list');
  list.innerHTML = '';
  p.verses.forEach(item => {
    const div = document.createElement('div');
    div.className = 'verse' + (item.v === curVerse ? ' active' : '');
    div.onclick = () => { curVerse = item.v; render(); };
    div.innerHTML = '<div><span class="v-num">' + item.v + '</span>' + item.cuv + '</div>' +
      (item.kjv ? '<div class="en">[KJV] ' + item.kjv + '</div>' : '') +
      (item.id_tl ? '<div class="en">[ID] ' + item.id_tl + '</div>' : '');
    list.appendChild(div);
  });
  renderProjector();
}
function renderProjector() {
  const p = PASSAGES[curIdx];
  const item = p.verses[curVerse - 1] || p.verses[0];
  if (!item) return;
  document.getElementById('proj-title').textContent = p.titleZh + ':' + item.v;
  document.getElementById('proj-body').innerHTML =
    '<div><span style="color:#FBBF24;margin-right:12px;">' + item.v + '</span>' + item.cuv + '</div>' +
    '<div style="font-family:Georgia,serif;font-size:0.82em;margin-top:18px;color:#E7E5E4;">' + item.kjv + '</div>';
  document.getElementById('proj-watermark').textContent = p.titleZh + ':' + item.v + ' · ' + p.titleEn + ':' + item.v;
}
function openProjector() {
  document.getElementById('projector').classList.add('open');
  renderProjector();
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
}
function closeProjector() {
  document.getElementById('projector').classList.remove('open');
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
}
function stepVerse(delta) {
  const p = PASSAGES[curIdx];
  curVerse = Math.max(1, Math.min(p.verses.length, curVerse + delta));
  render();
}
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') stepVerse(1);
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') stepVerse(-1);
  if (e.key === 'Escape') closeProjector();
});
render();
</script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '微读圣经-主日U盘离线备份版.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
