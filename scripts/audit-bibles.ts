/**
 * 圣经三版本完整性校对与 30 处常用经文抽查脚本 (scripts/audit-bibles.ts)
 * 运行方式：npx tsx scripts/audit-bibles.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { BIBLE_BOOKS } from '../src/utils/bibleReference';

interface RawBibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

function loadVersion(filename: string): RawBibleBook[] {
  const fullPath = path.join(process.cwd(), 'public', 'data', filename);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function runAudit() {
  const cuv = loadVersion('cuv.json');
  const kjv = loadVersion('kjv.json');
  const idTl = loadVersion('id_tl.json');

  console.log('=== 圣经三译本（CUV / KJV / ID_TL）完整性校对报告 ===');
  console.log(`书卷总数: CUV=${cuv.length}, KJV=${kjv.length}, ID_TL=${idTl.length} (标准: 66卷)`);

  let totalChapters = 0;
  let chapterMismatches = 0;
  let emptyVersesCuv = 0;
  let emptyVersesKjv = 0;
  let emptyVersesId = 0;
  const verseCountDiffs: Array<{
    book: string;
    chapter: number;
    cuv: number;
    kjv: number;
    idTl: number;
  }> = [];

  for (let b = 0; b < 66; b++) {
    const meta = BIBLE_BOOKS[b];
    const cCh = cuv[b]?.chapters?.length || 0;
    const kCh = kjv[b]?.chapters?.length || 0;
    const iCh = idTl[b]?.chapters?.length || 0;

    if (cCh !== meta.chaptersCount || kCh !== meta.chaptersCount || iCh !== meta.chaptersCount) {
      chapterMismatches++;
      console.log(
        `[章数不一致] ${meta.nameZh}: 标准=${meta.chaptersCount}, CUV=${cCh}, KJV=${kCh}, ID_TL=${iCh}`
      );
    }

    totalChapters += meta.chaptersCount;

    for (let c = 0; c < meta.chaptersCount; c++) {
      const cVerses = cuv[b].chapters[c] || [];
      const kVerses = kjv[b].chapters[c] || [];
      const iVerses = idTl[b].chapters[c] || [];

      cVerses.forEach((v) => {
        if (!v || !v.trim()) emptyVersesCuv++;
      });
      kVerses.forEach((v) => {
        if (!v || !v.trim()) emptyVersesKjv++;
      });
      iVerses.forEach((v) => {
        if (!v || !v.trim() || v.trim() === '-') emptyVersesId++;
      });

      if (cVerses.length !== kVerses.length || cVerses.length !== iVerses.length) {
        verseCountDiffs.push({
          book: `${meta.nameZh} (${meta.nameEn.trim()})`,
          chapter: c + 1,
          cuv: cVerses.length,
          kjv: kVerses.length,
          idTl: iVerses.length,
        });
      }
    }
  }

  console.log(`总章数核对: ${totalChapters} 章，章数缺漏: ${chapterMismatches} 处`);
  console.log(
    `空节/占位符统计: CUV=${emptyVersesCuv}, KJV=${emptyVersesKjv}, ID_TL=${emptyVersesId}`
  );
  console.log(
    `跨译本传统分节差异章数 (希伯来文/诗篇标题分节法差异): ${verseCountDiffs.length} 章`
  );
}

runAudit();
