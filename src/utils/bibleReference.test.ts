import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BIBLE_BOOKS,
  parseBibleReference,
  parseSermonInputList,
  paginateProjectorVerses,
  buildProjectorSlides,
  getAdjacentChapter,
  formatBookHeader,
  COMMON_30_SCRIPTURES,
} from './bibleReference';

test('BIBLE_BOOKS contains exact 66 canonical books (39 OT + 27 NT)', () => {
  assert.equal(BIBLE_BOOKS.length, 66);
  const ot = BIBLE_BOOKS.filter((b) => b.testament === 'OT');
  const nt = BIBLE_BOOKS.filter((b) => b.testament === 'NT');
  assert.equal(ot.length, 39);
  assert.equal(nt.length, 27);
});

test('parseBibleReference parses Chinese, English, Indonesian, and verse ranges accurately', () => {
  const jnZh = parseBibleReference('约翰福音 3:16');
  assert.deepEqual(jnZh, { bookIndex: 42, chapter: 3, verse: 16, endVerse: 16 });

  const jnRange = parseBibleReference('约3:16-21');
  assert.deepEqual(jnRange, { bookIndex: 42, chapter: 3, verse: 16, endVerse: 21 });

  const jnChapterVerseZh = parseBibleReference('约翰福音第3章16节');
  assert.deepEqual(jnChapterVerseZh, { bookIndex: 42, chapter: 3, verse: 16, endVerse: 16 });

  const jnEn = parseBibleReference('John 3:16');
  assert.deepEqual(jnEn, { bookIndex: 42, chapter: 3, verse: 16, endVerse: 16 });

  const jnId = parseBibleReference('Yohanes 3:16');
  assert.deepEqual(jnId, { bookIndex: 42, chapter: 3, verse: 16, endVerse: 16 });

  const psChapterOnly = parseBibleReference('诗篇 23');
  assert.deepEqual(psChapterOnly, {
    bookIndex: 18,
    chapter: 23,
    verse: 1,
    endVerse: 1,
    isWholeChapter: true,
  });
});

test('parseSermonInputList parses multiple references separated by punctuation', () => {
  const items = parseSermonInputList('约3:16、罗8:28-30、诗23');
  assert.equal(items.length, 3);
  assert.equal(items[0].label, '约翰福音 3:16');
  assert.equal(items[1].label, '罗马书 8:28-30');
  assert.equal(items[1].startVerse, 28);
  assert.equal(items[1].endVerse, 30);
  assert.equal(items[2].label, '诗篇 23章');
  assert.equal(items[2].isWholeChapter, true);
});

test('paginateProjectorVerses splits long multi-verse or trilingual selections into pages', () => {
  const verses = [16, 17, 18, 19, 20, 21];
  // 3 versions -> 1 verse per page so nothing ever clips or overflows
  const pagesTrilingual = paginateProjectorVerses(
    verses,
    ['cuv', 'kjv', 'id_tl'],
    (_ver, v) => `Sample verse text for verse ${v} with moderate length.`
  );
  assert.equal(pagesTrilingual.length, 6);
  assert.deepEqual(pagesTrilingual[0], [16]);

  // 1 version -> groups multiple verses per page within character budget
  const pagesSingle = paginateProjectorVerses(
    verses,
    ['cuv'],
    (_ver, v) => `第${v}节短经文。`
  );
  assert.equal(pagesSingle.length, 2);
  assert.deepEqual(pagesSingle[0], [16, 17, 18]);
  assert.deepEqual(pagesSingle[1], [19, 20, 21]);
});

test('buildProjectorSlides automatically splits single overflowing verse into balanced sub-slides', () => {
  const longZh =
    '那时王的书记已被召来，就是三月初三日，乃西弯月二十三日，按着末底改所吩咐的，用各省的文字、各族的方言，并犹大人的文字方言写谕旨，传给总督、省长和印度直到古实一百二十七省的首领。';
  const longEn =
    'Then were the king’s scribes called at that time in the third month, that is, the month Sivan, on the three and twentieth day thereof; and it was written according to all that Mordecai commanded unto the Jews, and to the lieutenants, and the deputies and rulers of the provinces which are from India unto Ethiopia, an hundred twenty and seven provinces.';
  const longId =
    'Maka pada masa itu juga dipanggillah segala jurutulis baginda, yaitu pada bulan yang ketiga, itulah bulan Siwan, pada dua puluh tiga hari bulan itu, maka disuratkannya sekalian yang disuruhkan oleh Mordekhai kepada segala orang Yahudi dan kepada segala wakil raja dan penghulu dan kepala daerah yang dari India datang ke Habsyi, seratus dua puluh tujuh daerah.';

  const slides = buildProjectorSlides({
    verses: [9],
    activeVersions: ['cuv', 'kjv', 'id_tl'],
    compareLayout: 'stacked',
    fontSize: 44,
    stageWidth: 1024,
    stageHeight: 480, // Constrained height forces automatic single-verse splitting
    getVerseText: (ver) => (ver === 'cuv' ? longZh : ver === 'kjv' ? longEn : longId),
  });

  assert.ok(slides.length >= 2, 'Should split overflowing single verse into at least 2 slides');
  assert.equal(slides[0].partIndex, 1);
  assert.equal(slides[0].totalParts, slides.length);
  assert.ok(slides[0].textsByVersion.cuv[9].length < longZh.length);
});

test('getAdjacentChapter and COMMON_30_SCRIPTURES are valid', () => {
  assert.deepEqual(getAdjacentChapter(0, 50, 'next'), { bookIndex: 1, chapter: 1 });
  assert.equal(COMMON_30_SCRIPTURES.length, 30);
  assert.equal(
    formatBookHeader(42, 3, ['cuv', 'kjv', 'id_tl']),
    '约翰福音 3章 · John 3 · Yohanes 3'
  );
});
