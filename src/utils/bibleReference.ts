/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 圣经书卷元数据、译本授权说明、经文引文解析、投影自动分页与 30 处常用经文抽查工具
 *
 * 【三个译本的数据来源与授权情况说明（重要）】
 * 1. 英文 (KJV) - King James Version (1769 Standard Text)
 *    - 数据来源：Open-source Bible JSON repository (thiagobodruk/bible, en_kjv.json)
 *    - 授权状态：Public Domain（公有领域），全球范围内可免费离线分发、阅读与教会投影使用，无任何版权风险。
 *
 * 2. 中文 (CUV) - 中文和合本（简体·新标点神版，1919年首版）
 *    - 数据来源：Open-source Bible JSON repository (thiagobodruk/bible, zh_cunpss-shen.json)
 *    - 授权状态：Public Domain（公有领域），1919年由官话和合译本委员会出版，可免费离线分发、阅读与教会礼拜投影。
 *
 * 3. 印尼语 (TL) - Alkitab Terjemahan Lama (1954)
 *    - 数据来源：Beblia Holy-Bible-XML-Format (IndonesianTLBible.xml) 转换生成的完整 66 卷 JSON
 *    - 授权状态与重要提醒：
 *      - 本项目采用的 Alkitab Terjemahan Lama (TL 1954) 由印尼圣经公会 (Lembaga Alkitab Indonesia, LAI) 于 1954 年合订出版
 *        （整合 Klinkert 1879 旧约与 Bode 1938 新约）。依据印尼版权法 (UU Hak Cipta) 对汇编/法人作品出版满 50 年的保护期规定，
 *        1954 版文本已进入公有领域 (Public Domain)。
 *      - 【特别提醒牧者】：印尼教会另一常见译本 Terjemahan Baru (TB 1974 / TB2 2023) 及现代意译本 TSI 仍受印尼圣经公会 (LAI)
 *        或 Albata 严格版权保护，不可在未经书面授权的情况下打包进公开离线网页分发。因此本系统特意选用公有领域的 TL (1954) 完整 66 卷，
 *        确保教会在主日崇拜投影与离线备份时合法合规、无版权隐患。
 */

export type VersionId = 'cuv' | 'kjv' | 'id_tl';

export type LanguagePresetId = 'zh_only' | 'zh_en' | 'zh_id' | 'trilingual' | 'custom';

export interface LanguagePreset {
  id: Exclude<LanguagePresetId, 'custom'>;
  label: string;
  versions: VersionId[];
}

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  { id: 'zh_only', label: '只中文', versions: ['cuv'] },
  { id: 'zh_en', label: '中英', versions: ['cuv', 'kjv'] },
  { id: 'zh_id', label: '中印', versions: ['cuv', 'id_tl'] },
  { id: 'trilingual', label: '三语', versions: ['cuv', 'kjv', 'id_tl'] },
];

export interface BibleVersionMeta {
  id: VersionId;
  shortName: string;
  name: string;
  nativeName: string;
  lang: 'zh' | 'en' | 'id';
  file: string;
  publisher: string;
  year: string;
  license: string;
  sourceNote: string;
  copyrightReminder?: string;
}

export const BIBLE_VERSIONS: BibleVersionMeta[] = [
  {
    id: 'cuv',
    shortName: '和合本',
    name: '中文和合本 (CUV 简体)',
    nativeName: '和合本 (CUV)',
    lang: 'zh',
    file: '/data/cuv.json',
    publisher: '官话和合译本委员会 / 联合圣经公会',
    year: '1919',
    license: 'Public Domain (公有领域)',
    sourceNote: '1919年中文圣经和合本简体神版，公有领域免费离线使用',
  },
  {
    id: 'kjv',
    shortName: 'KJV',
    name: 'King James Version (英文)',
    nativeName: 'English (KJV)',
    lang: 'en',
    file: '/data/kjv.json',
    publisher: 'Blayney Standard Text (Oxford)',
    year: '1769 (1611)',
    license: 'Public Domain (公有领域)',
    sourceNote: 'King James Version 1769 标准文本，无需 API 密钥，全球公有领域免费使用',
  },
  {
    id: 'id_tl',
    shortName: '印尼语 TL',
    name: 'Alkitab Terjemahan Lama (印尼语)',
    nativeName: 'Indonesia (TL 1954)',
    lang: 'id',
    file: '/data/id_tl.json',
    publisher: 'Lembaga Alkitab Indonesia (Klinkert 1879 / Bode 1938)',
    year: '1954',
    license: 'Public Domain (印尼版权法逾50年公有领域)',
    sourceNote: 'Alkitab Terjemahan Lama 1954 完整 66 卷，旧约有些诗篇标题独立计为第 1 节',
    copyrightReminder:
      '注意：印尼语新版 Terjemahan Baru (TB 1974) 仍受版权保护；本软件使用的是 1954 年公有领域版 Terjemahan Lama (TL)，若教会需公开商业印刷请遵循印尼圣经公会 (LAI) 指引。',
  },
];

export interface BookMeta {
  index: number; // 0..65
  testament: 'OT' | 'NT';
  category: string;
  nameZh: string;
  abbrevZh: string;
  aliasesZh: string[];
  nameEn: string;
  abbrevEn: string;
  aliasesEn: string[];
  nameId: string;
  abbrevId: string;
  chaptersCount: number;
}

export const BIBLE_BOOKS: BookMeta[] = [
  // 旧约 39 卷 (Old Testament)
  { index: 0, testament: 'OT', category: '摩西五经', nameZh: '创世记', abbrevZh: '创', aliasesZh: ['创世纪'], nameEn: 'Genesis', abbrevEn: 'Gen', aliasesEn: ['Gn'], nameId: 'Kejadian', abbrevId: 'Kej', chaptersCount: 50 },
  { index: 1, testament: 'OT', category: '摩西五经', nameZh: '出埃及记', abbrevZh: '出', aliasesZh: ['出埃及'], nameEn: 'Exodus', abbrevEn: 'Exod', aliasesEn: ['Ex', 'Exo'], nameId: 'Keluaran', abbrevId: 'Kel', chaptersCount: 40 },
  { index: 2, testament: 'OT', category: '摩西五经', nameZh: '利未记', abbrevZh: '利', aliasesZh: [], nameEn: 'Leviticus', abbrevEn: 'Lev', aliasesEn: ['Lv'], nameId: 'Imamat', abbrevId: 'Im', chaptersCount: 27 },
  { index: 3, testament: 'OT', category: '摩西五经', nameZh: '民数记', abbrevZh: '民', aliasesZh: [], nameEn: 'Numbers', abbrevEn: 'Num', aliasesEn: ['Nm', 'Nu'], nameId: 'Bilangan', abbrevId: 'Bil', chaptersCount: 36 },
  { index: 4, testament: 'OT', category: '摩西五经', nameZh: '申命记', abbrevZh: '申', aliasesZh: [], nameEn: 'Deuteronomy', abbrevEn: 'Deut', aliasesEn: ['Dt', 'Deu'], nameId: 'Ulangan', abbrevId: 'Ul', chaptersCount: 34 },
  { index: 5, testament: 'OT', category: '历史书', nameZh: '约书亚记', abbrevZh: '书', aliasesZh: ['约书亚'], nameEn: 'Joshua', abbrevEn: 'Josh', aliasesEn: ['Jos'], nameId: 'Yosua', abbrevId: 'Yos', chaptersCount: 24 },
  { index: 6, testament: 'OT', category: '历史书', nameZh: '士师记', abbrevZh: '士', aliasesZh: ['士师'], nameEn: 'Judges', abbrevEn: 'Judg', aliasesEn: ['Jdg'], nameId: 'Hakim-hakim', abbrevId: 'Hak', chaptersCount: 21 },
  { index: 7, testament: 'OT', category: '历史书', nameZh: '路得记', abbrevZh: '得', aliasesZh: ['路得'], nameEn: 'Ruth', abbrevEn: 'Ruth', aliasesEn: ['Rth', 'Ru'], nameId: 'Rut', abbrevId: 'Rut', chaptersCount: 4 },
  { index: 8, testament: 'OT', category: '历史书', nameZh: '撒母耳记上', abbrevZh: '撒上', aliasesZh: ['撒母耳上'], nameEn: '1 Samuel', abbrevEn: '1Sam', aliasesEn: ['1 Sam', '1Sa', 'I Samuel'], nameId: '1 Samuel', abbrevId: '1Sam', chaptersCount: 31 },
  { index: 9, testament: 'OT', category: '历史书', nameZh: '撒母耳记下', abbrevZh: '撒下', aliasesZh: ['撒母耳下'], nameEn: '2 Samuel', abbrevEn: '2Sam', aliasesEn: ['2 Sam', '2Sa', 'II Samuel'], nameId: '2 Samuel', abbrevId: '2Sam', chaptersCount: 24 },
  { index: 10, testament: 'OT', category: '历史书', nameZh: '列王纪上', abbrevZh: '王上', aliasesZh: ['列王记上'], nameEn: '1 Kings', abbrevEn: '1Kgs', aliasesEn: ['1 Kings', '1Ki', 'I Kings'], nameId: '1 Raja-raja', abbrevId: '1Raj', chaptersCount: 22 },
  { index: 11, testament: 'OT', category: '历史书', nameZh: '列王纪下', abbrevZh: '王下', aliasesZh: ['列王记下'], nameEn: '2 Kings', abbrevEn: '2Kgs', aliasesEn: ['2 Kings', '2Ki', 'II Kings'], nameId: '2 Raja-raja', abbrevId: '2Raj', chaptersCount: 25 },
  { index: 12, testament: 'OT', category: '历史书', nameZh: '历代志上', abbrevZh: '代上', aliasesZh: [], nameEn: '1 Chronicles', abbrevEn: '1Chr', aliasesEn: ['1 Chr', '1Ch'], nameId: '1 Tawarikh', abbrevId: '1Taw', chaptersCount: 29 },
  { index: 13, testament: 'OT', category: '历史书', nameZh: '历代志下', abbrevZh: '代下', aliasesZh: [], nameEn: '2 Chronicles', abbrevEn: '2Chr', aliasesEn: ['2 Chr', '2Ch'], nameId: '2 Tawarikh', abbrevId: '2Taw', chaptersCount: 36 },
  { index: 14, testament: 'OT', category: '历史书', nameZh: '以斯拉记', abbrevZh: '拉', aliasesZh: ['以斯拉'], nameEn: 'Ezra', abbrevEn: 'Ezra', aliasesEn: ['Ezr'], nameId: 'Ezra', abbrevId: 'Ezr', chaptersCount: 10 },
  { index: 15, testament: 'OT', category: '历史书', nameZh: '尼希米记', abbrevZh: '尼', aliasesZh: ['尼希米'], nameEn: 'Nehemiah', abbrevEn: 'Neh', aliasesEn: ['Ne'], nameId: 'Nehemia', abbrevId: 'Neh', chaptersCount: 13 },
  { index: 16, testament: 'OT', category: '历史书', nameZh: '以斯帖记', abbrevZh: '斯', aliasesZh: ['以斯帖'], nameEn: 'Esther', abbrevEn: 'Esth', aliasesEn: ['Est', 'Es'], nameId: 'Ester', abbrevId: 'Est', chaptersCount: 10 },
  { index: 17, testament: 'OT', category: '诗歌智慧书', nameZh: '约伯记', abbrevZh: '伯', aliasesZh: ['约伯'], nameEn: 'Job', abbrevEn: 'Job', aliasesEn: ['Jb'], nameId: 'Ayub', abbrevId: 'Ayb', chaptersCount: 42 },
  { index: 18, testament: 'OT', category: '诗歌智慧书', nameZh: '诗篇', abbrevZh: '诗', aliasesZh: [], nameEn: 'Psalms', abbrevEn: 'Ps', aliasesEn: ['Psalm', 'Psa', 'Psm'], nameId: 'Mazmur', abbrevId: 'Mzm', chaptersCount: 150 },
  { index: 19, testament: 'OT', category: '诗歌智慧书', nameZh: '箴言', abbrevZh: '箴', aliasesZh: [], nameEn: 'Proverbs', abbrevEn: 'Prov', aliasesEn: ['Pro', 'Prv', 'Pr'], nameId: 'Amsal', abbrevId: 'Ams', chaptersCount: 31 },
  { index: 20, testament: 'OT', category: '诗歌智慧书', nameZh: '传道书', abbrevZh: '传', aliasesZh: ['传道'], nameEn: 'Ecclesiastes', abbrevEn: 'Eccl', aliasesEn: ['Ecc', 'Ec'], nameId: 'Pengkhotbah', abbrevId: 'Pkh', chaptersCount: 12 },
  { index: 21, testament: 'OT', category: '诗歌智慧书', nameZh: '雅歌', abbrevZh: '歌', aliasesZh: [], nameEn: 'Song of Solomon', abbrevEn: 'Song', aliasesEn: ['Song of Songs', 'SOS', 'Sg'], nameId: 'Kidung Agung', abbrevId: 'Kid', chaptersCount: 8 },
  { index: 22, testament: 'OT', category: '大先知书', nameZh: '以赛亚书', abbrevZh: '赛', aliasesZh: ['以赛亚'], nameEn: 'Isaiah', abbrevEn: 'Isa', aliasesEn: ['Is'], nameId: 'Yesaya', abbrevId: 'Yes', chaptersCount: 66 },
  { index: 23, testament: 'OT', category: '大先知书', nameZh: '耶利米书', abbrevZh: '耶', aliasesZh: ['耶利米'], nameEn: 'Jeremiah', abbrevEn: 'Jer', aliasesEn: ['Je', 'Jr'], nameId: 'Yeremia', abbrevId: 'Yer', chaptersCount: 52 },
  { index: 24, testament: 'OT', category: '大先知书', nameZh: '耶利米哀歌', abbrevZh: '哀', aliasesZh: ['哀歌'], nameEn: 'Lamentations', abbrevEn: 'Lam', aliasesEn: ['La'], nameId: 'Ratapan', abbrevId: 'Rat', chaptersCount: 5 },
  { index: 25, testament: 'OT', category: '大先知书', nameZh: '以西结书', abbrevZh: '结', aliasesZh: ['以西结'], nameEn: 'Ezekiel', abbrevEn: 'Ezek', aliasesEn: ['Eze', 'Ezk'], nameId: 'Yehezkiel', abbrevId: 'Yeh', chaptersCount: 48 },
  { index: 26, testament: 'OT', category: '大先知书', nameZh: '但以理书', abbrevZh: '但', aliasesZh: ['但以理'], nameEn: 'Daniel', abbrevEn: 'Dan', aliasesEn: ['Da', 'Dn'], nameId: 'Daniel', abbrevId: 'Dan', chaptersCount: 12 },
  { index: 27, testament: 'OT', category: '小先知书', nameZh: '何西阿书', abbrevZh: '何', aliasesZh: ['何西阿'], nameEn: 'Hosea', abbrevEn: 'Hos', aliasesEn: ['Ho'], nameId: 'Hosea', abbrevId: 'Hos', chaptersCount: 14 },
  { index: 28, testament: 'OT', category: '小先知书', nameZh: '约珥书', abbrevZh: '珥', aliasesZh: ['约珥'], nameEn: 'Joel', abbrevEn: 'Joel', aliasesEn: ['Jl', 'Joe'], nameId: 'Yoel', abbrevId: 'Yoe', chaptersCount: 3 },
  { index: 29, testament: 'OT', category: '小先知书', nameZh: '阿摩司书', abbrevZh: '摩', aliasesZh: ['阿摩司'], nameEn: 'Amos', abbrevEn: 'Amos', aliasesEn: ['Am'], nameId: 'Amos', abbrevId: 'Am', chaptersCount: 9 },
  { index: 30, testament: 'OT', category: '小先知书', nameZh: '俄巴底亚书', abbrevZh: '俄', aliasesZh: ['俄巴底亚'], nameEn: 'Obadiah', abbrevEn: 'Obad', aliasesEn: ['Ob', 'Oba'], nameId: 'Obaja', abbrevId: 'Oba', chaptersCount: 1 },
  { index: 31, testament: 'OT', category: '小先知书', nameZh: '约拿书', abbrevZh: '拿', aliasesZh: ['约拿'], nameEn: 'Jonah', abbrevEn: 'Jonah', aliasesEn: ['Jon', 'Jnh'], nameId: 'Yunus', abbrevId: 'Yun', chaptersCount: 4 },
  { index: 32, testament: 'OT', category: '小先知书', nameZh: '弥迦书', abbrevZh: '弥', aliasesZh: ['弥迦'], nameEn: 'Micah', abbrevEn: 'Mic', aliasesEn: ['Mc'], nameId: 'Mikha', abbrevId: 'Mik', chaptersCount: 7 },
  { index: 33, testament: 'OT', category: '小先知书', nameZh: '那鸿书', abbrevZh: '鸿', aliasesZh: ['那鸿'], nameEn: 'Nahum', abbrevEn: 'Nah', aliasesEn: ['Na'], nameId: 'Nahum', abbrevId: 'Nah', chaptersCount: 3 },
  { index: 34, testament: 'OT', category: '小先知书', nameZh: '哈巴谷书', abbrevZh: '哈', aliasesZh: ['哈巴谷'], nameEn: 'Habakkuk', abbrevEn: 'Hab', aliasesEn: ['Hb'], nameId: 'Habakuk', abbrevId: 'Hab', chaptersCount: 3 },
  { index: 35, testament: 'OT', category: '小先知书', nameZh: '西番雅书', abbrevZh: '番', aliasesZh: ['西番雅'], nameEn: 'Zephaniah', abbrevEn: 'Zeph', aliasesEn: ['Zep', 'Zp'], nameId: 'Zefanya', abbrevId: 'Zef', chaptersCount: 3 },
  { index: 36, testament: 'OT', category: '小先知书', nameZh: '哈该书', abbrevZh: '该', aliasesZh: ['哈该'], nameEn: 'Haggai', abbrevEn: 'Hag', aliasesEn: ['Hg'], nameId: 'Hagai', abbrevId: 'Hag', chaptersCount: 2 },
  { index: 37, testament: 'OT', category: '小先知书', nameZh: '撒迦利亚书', abbrevZh: '亚', aliasesZh: ['撒迦利亚'], nameEn: 'Zechariah', abbrevEn: 'Zech', aliasesEn: ['Zec', 'Zc'], nameId: 'Zakharia', abbrevId: 'Zak', chaptersCount: 14 },
  { index: 38, testament: 'OT', category: '小先知书', nameZh: '玛拉基书', abbrevZh: '玛', aliasesZh: ['玛拉基'], nameEn: 'Malachi', abbrevEn: 'Mal', aliasesEn: ['Ml'], nameId: 'Maleakhi', abbrevId: 'Mal', chaptersCount: 4 },

  // 新约 27 卷 (New Testament)
  { index: 39, testament: 'NT', category: '四福音书', nameZh: '马太福音', abbrevZh: '太', aliasesZh: ['马太'], nameEn: 'Matthew', abbrevEn: 'Matt', aliasesEn: ['Mt', 'Mat'], nameId: 'Matius', abbrevId: 'Mat', chaptersCount: 28 },
  { index: 40, testament: 'NT', category: '四福音书', nameZh: '马可福音', abbrevZh: '可', aliasesZh: ['马可'], nameEn: 'Mark', abbrevEn: 'Mark', aliasesEn: ['Mk', 'Mrk'], nameId: 'Markus', abbrevId: 'Mrk', chaptersCount: 16 },
  { index: 41, testament: 'NT', category: '四福音书', nameZh: '路加福音', abbrevZh: '路', aliasesZh: ['路加'], nameEn: 'Luke', abbrevEn: 'Luke', aliasesEn: ['Lk', 'Luk'], nameId: 'Lukas', abbrevId: 'Luk', chaptersCount: 24 },
  { index: 42, testament: 'NT', category: '四福音书', nameZh: '约翰福音', abbrevZh: '约', aliasesZh: ['约翰'], nameEn: 'John', abbrevEn: 'John', aliasesEn: ['Jn', 'Jhn'], nameId: 'Yohanes', abbrevId: 'Yoh', chaptersCount: 21 },
  { index: 43, testament: 'NT', category: '教会历史', nameZh: '使徒行传', abbrevZh: '徒', aliasesZh: ['使徒'], nameEn: 'Acts', abbrevEn: 'Acts', aliasesEn: ['Act', 'Ac'], nameId: 'Kisah Para Rasul', abbrevId: 'Kis', chaptersCount: 28 },
  { index: 44, testament: 'NT', category: '保罗书信', nameZh: '罗马书', abbrevZh: '罗', aliasesZh: ['罗马'], nameEn: 'Romans', abbrevEn: 'Rom', aliasesEn: ['Ro', 'Rm'], nameId: 'Roma', abbrevId: 'Rom', chaptersCount: 16 },
  { index: 45, testament: 'NT', category: '保罗书信', nameZh: '哥林多前书', abbrevZh: '林前', aliasesZh: ['哥林多前'], nameEn: '1 Corinthians', abbrevEn: '1Cor', aliasesEn: ['1 Cor', '1Co'], nameId: '1 Korintus', abbrevId: '1Kor', chaptersCount: 16 },
  { index: 46, testament: 'NT', category: '保罗书信', nameZh: '哥林多后书', abbrevZh: '林后', aliasesZh: ['哥林多后'], nameEn: '2 Corinthians', abbrevEn: '2Cor', aliasesEn: ['2 Cor', '2Co'], nameId: '2 Korintus', abbrevId: '2Kor', chaptersCount: 13 },
  { index: 47, testament: 'NT', category: '保罗书信', nameZh: '加拉太书', abbrevZh: '加', aliasesZh: ['加拉太'], nameEn: 'Galatians', abbrevEn: 'Gal', aliasesEn: ['Ga'], nameId: 'Galatia', abbrevId: 'Gal', chaptersCount: 6 },
  { index: 48, testament: 'NT', category: '保罗书信', nameZh: '以弗所书', abbrevZh: '弗', aliasesZh: ['以弗所'], nameEn: 'Ephesians', abbrevEn: 'Eph', aliasesEn: ['Ep'], nameId: 'Efesus', abbrevId: 'Ef', chaptersCount: 6 },
  { index: 49, testament: 'NT', category: '保罗书信', nameZh: '腓立比书', abbrevZh: '腓', aliasesZh: ['腓立比'], nameEn: 'Philippians', abbrevEn: 'Phil', aliasesEn: ['Php', 'Pp'], nameId: 'Filipi', abbrevId: 'Flp', chaptersCount: 4 },
  { index: 50, testament: 'NT', category: '保罗书信', nameZh: '歌罗西书', abbrevZh: '西', aliasesZh: ['歌罗西'], nameEn: 'Colossians', abbrevEn: 'Col', aliasesEn: ['Co'], nameId: 'Kolose', abbrevId: 'Kol', chaptersCount: 4 },
  { index: 51, testament: 'NT', category: '保罗书信', nameZh: '帖撒罗尼迦前书', abbrevZh: '帖前', aliasesZh: ['帖撒罗尼迦前'], nameEn: '1 Thessalonians', abbrevEn: '1Thess', aliasesEn: ['1 Thess', '1Th'], nameId: '1 Tesalonika', abbrevId: '1Tes', chaptersCount: 5 },
  { index: 52, testament: 'NT', category: '保罗书信', nameZh: '帖撒罗尼迦后书', abbrevZh: '帖后', aliasesZh: ['帖撒罗尼迦后'], nameEn: '2 Thessalonians', abbrevEn: '2Thess', aliasesEn: ['2 Thess', '2Th'], nameId: '2 Tesalonika', abbrevId: '2Tes', chaptersCount: 3 },
  { index: 53, testament: 'NT', category: '保罗书信', nameZh: '提摩太前书', abbrevZh: '提前', aliasesZh: ['提摩太前'], nameEn: '1 Timothy', abbrevEn: '1Tim', aliasesEn: ['1 Tim', '1Ti'], nameId: '1 Timotius', abbrevId: '1Tim', chaptersCount: 6 },
  { index: 54, testament: 'NT', category: '保罗书信', nameZh: '提摩太后书', abbrevZh: '提后', aliasesZh: ['提摩太后'], nameEn: '2 Timothy', abbrevEn: '2Tim', aliasesEn: ['2 Tim', '2Ti'], nameId: '2 Timotius', abbrevId: '2Tim', chaptersCount: 4 },
  { index: 55, testament: 'NT', category: '保罗书信', nameZh: '提多书', abbrevZh: '多', aliasesZh: ['提多'], nameEn: 'Titus', abbrevEn: 'Titus', aliasesEn: ['Tit', 'Ti'], nameId: 'Titus', abbrevId: 'Tit', chaptersCount: 3 },
  { index: 56, testament: 'NT', category: '保罗书信', nameZh: '腓利门书', abbrevZh: '门', aliasesZh: ['腓利门'], nameEn: 'Philemon', abbrevEn: 'Phlm', aliasesEn: ['Phm', 'Pm'], nameId: 'Filemon', abbrevId: 'Flm', chaptersCount: 1 },
  { index: 57, testament: 'NT', category: '普通书信', nameZh: '希伯来书', abbrevZh: '来', aliasesZh: ['希伯来'], nameEn: 'Hebrews', abbrevEn: 'Heb', aliasesEn: ['He'], nameId: 'Ibrani', abbrevId: 'Ibr', chaptersCount: 13 },
  { index: 58, testament: 'NT', category: '普通书信', nameZh: '雅各书', abbrevZh: '雅', aliasesZh: ['雅各'], nameEn: 'James', abbrevEn: 'Jas', aliasesEn: ['Jm', 'Jam'], nameId: 'Yakobus', abbrevId: 'Yak', chaptersCount: 5 },
  { index: 59, testament: 'NT', category: '普通书信', nameZh: '彼得前书', abbrevZh: '彼前', aliasesZh: ['彼得前'], nameEn: '1 Peter', abbrevEn: '1Pet', aliasesEn: ['1 Pet', '1Pe', '1Pt'], nameId: '1 Petrus', abbrevId: '1Ptr', chaptersCount: 5 },
  { index: 60, testament: 'NT', category: '普通书信', nameZh: '彼得后书', abbrevZh: '彼后', aliasesZh: ['彼得后'], nameEn: '2 Peter', abbrevEn: '2Pet', aliasesEn: ['2 Pet', '2Pe', '2Pt'], nameId: '2 Petrus', abbrevId: '2Ptr', chaptersCount: 3 },
  { index: 61, testament: 'NT', category: '普通书信', nameZh: '约翰一书', abbrevZh: '约一', aliasesZh: ['约翰壹书', '约壹'], nameEn: '1 John', abbrevEn: '1John', aliasesEn: ['1 John', '1Jn', '1Jo'], nameId: '1 Yohanes', abbrevId: '1Yoh', chaptersCount: 5 },
  { index: 62, testament: 'NT', category: '普通书信', nameZh: '约翰二书', abbrevZh: '约二', aliasesZh: ['约翰贰书', '约贰'], nameEn: '2 John', abbrevEn: '2John', aliasesEn: ['2 John', '2Jn', '2Jo'], nameId: '2 Yohanes', abbrevId: '2Yoh', chaptersCount: 1 },
  { index: 63, testament: 'NT', category: '普通书信', nameZh: '约翰三书', abbrevZh: '约三', aliasesZh: ['约翰叁书', '约叁'], nameEn: '3 John', abbrevEn: '3John', aliasesEn: ['3 John', '3Jn', '3Jo'], nameId: '3 Yohanes', abbrevId: '3Yoh', chaptersCount: 1 },
  { index: 64, testament: 'NT', category: '普通书信', nameZh: '犹大书', abbrevZh: '犹', aliasesZh: ['犹大'], nameEn: 'Jude', abbrevEn: 'Jude', aliasesEn: ['Jud', 'Jd'], nameId: 'Yudas', abbrevId: 'Yud', chaptersCount: 1 },
  { index: 65, testament: 'NT', category: '预言书', nameZh: '启示录', abbrevZh: '启', aliasesZh: ['启示'], nameEn: 'Revelation', abbrevEn: 'Rev', aliasesEn: ['Re', 'Rv', 'Apocalypse'], nameId: 'Wahyu', abbrevId: 'Why', chaptersCount: 22 },
];

export interface ParsedReference {
  bookIndex: number;
  chapter: number; // 1-based
  verse: number; // 1-based
  endVerse: number; // 1-based
  isWholeChapter?: boolean;
}

/**
 * 归一化书卷名称以便模糊匹配
 */
function normalizeBookToken(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\./g, '');
}

/**
 * 根据用户输入文本查找匹配的圣经书卷 (0..65)
 */
export function findBookByQuery(bookQuery: string): BookMeta | null {
  const norm = normalizeBookToken(bookQuery);
  if (!norm) return null;

  for (const book of BIBLE_BOOKS) {
    const candidates = [
      book.nameZh,
      book.abbrevZh,
      ...book.aliasesZh,
      book.nameEn,
      book.abbrevEn,
      ...book.aliasesEn,
      book.nameId,
      book.abbrevId,
    ].map(normalizeBookToken);

    if (candidates.includes(norm)) {
      return book;
    }
  }

  for (const book of BIBLE_BOOKS) {
    const candidates = [
      book.nameZh,
      ...book.aliasesZh,
      book.nameEn,
      ...book.aliasesEn,
      book.nameId,
    ].map(normalizeBookToken);

    if (candidates.some((c) => c.startsWith(norm) && norm.length >= 2)) {
      return book;
    }
  }

  return null;
}

/**
 * 解析经文快速跳转输入
 * 支持格式示例：
 * - "约翰福音 3:16" / "约 3:16" / "约翰福音3章16节" / "约3:16-21"
 * - "John 3:16-21" / "Jn 3:16" / "1 Cor 13:4-8"
 * - "Yohanes 3:16" / "Kejadian 1:1"
 * - "诗篇 23" / "诗23" (只输入章时标记 isWholeChapter: true)
 */
export function parseBibleReference(input: string): ParsedReference | null {
  const cleaned = input
    .trim()
    .replace(/：/g, ':')
    .replace(/－|—|–|～|~/g, '-')
    .replace(/第/g, '')
    .replace(/章/g, ':')
    .replace(/节|節|篇/g, (m) => (m === '篇' ? '篇' : ''));

  if (!cleaned) return null;

  const match = cleaned.match(
    /^([1-3]?\s*[a-zA-Z\u4e00-\u9fa5\-]+(?:\s+[a-zA-Z\u4e00-\u9fa5\-]+)*?)\s*(\d+)(?:\s*[:\s]\s*(\d+)?(?:\s*-\s*(\d+))?)?$/
  );

  if (!match) {
    const bookOnly = findBookByQuery(cleaned);
    if (bookOnly) {
      return {
        bookIndex: bookOnly.index,
        chapter: 1,
        verse: 1,
        endVerse: 1,
      };
    }
    return null;
  }

  const [, rawBook, rawChapter, rawVerse, rawEndVerse] = match;
  const book = findBookByQuery(rawBook);
  if (!book) return null;

  const chapter = Math.max(1, Math.min(book.chaptersCount, parseInt(rawChapter, 10) || 1));
  const isWholeChapter = !rawVerse;
  const verse = rawVerse ? Math.max(1, parseInt(rawVerse, 10) || 1) : 1;
  const endVerse = rawEndVerse ? Math.max(verse, parseInt(rawEndVerse, 10) || verse) : verse;

  return {
    bookIndex: book.index,
    chapter,
    verse,
    endVerse,
    ...(isWholeChapter ? { isWholeChapter: true } : {}),
  };
}

/**
 * 讲道经文清单条目数据结构
 */
export interface SermonScriptureItem {
  id: string;
  label: string;
  bookIndex: number;
  chapter: number;
  startVerse: number;
  endVerse: number;
  isWholeChapter?: boolean;
}

/**
 * 格式化标准中文经文引文标签（如 "约翰福音 3:16-21" 或 "诗篇 23章"）
 */
export function formatReferenceLabel(
  bookIndex: number,
  chapter: number,
  startVerse: number,
  endVerse: number,
  isWholeChapter?: boolean
): string {
  const book = BIBLE_BOOKS[bookIndex] || BIBLE_BOOKS[0];
  if (isWholeChapter) {
    return `${book.nameZh} ${chapter}章`;
  }
  if (startVerse === endVerse) {
    return `${book.nameZh} ${chapter}:${startVerse}`;
  }
  return `${book.nameZh} ${chapter}:${startVerse}-${endVerse}`;
}

/**
 * 批量解析讲道经文清单输入（支持顿号、逗号、分号或换行分隔，如 "约3:16、罗8:28-30、诗23"）
 */
export function parseSermonInputList(rawInput: string): SermonScriptureItem[] {
  const tokens = rawInput
    .split(/[、,，;；\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const results: SermonScriptureItem[] = [];
  for (const token of tokens) {
    const parsed = parseBibleReference(token);
    if (parsed) {
      results.push({
        id: `${parsed.bookIndex}-${parsed.chapter}-${parsed.verse}-${parsed.endVerse}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        label: formatReferenceLabel(
          parsed.bookIndex,
          parsed.chapter,
          parsed.verse,
          parsed.endVerse,
          parsed.isWholeChapter
        ),
        bookIndex: parsed.bookIndex,
        chapter: parsed.chapter,
        startVerse: parsed.verse,
        endVerse: parsed.endVerse,
        isWholeChapter: parsed.isWholeChapter,
      });
    }
  }
  return results;
}

/**
 * 计算上一章 / 下一章位置（支持跨书卷无缝翻章）
 */
export function getAdjacentChapter(
  bookIndex: number,
  chapter: number,
  direction: 'prev' | 'next'
): { bookIndex: number; chapter: number } {
  const currentBook = BIBLE_BOOKS[bookIndex] || BIBLE_BOOKS[0];

  if (direction === 'next') {
    if (chapter < currentBook.chaptersCount) {
      return { bookIndex, chapter: chapter + 1 };
    }
    const nextBookIndex = (bookIndex + 1) % BIBLE_BOOKS.length;
    return { bookIndex: nextBookIndex, chapter: 1 };
  } else {
    if (chapter > 1) {
      return { bookIndex, chapter: chapter - 1 };
    }
    const prevBookIndex = (bookIndex - 1 + BIBLE_BOOKS.length) % BIBLE_BOOKS.length;
    return {
      bookIndex: prevBookIndex,
      chapter: BIBLE_BOOKS[prevBookIndex].chaptersCount,
    };
  }
}

/**
 * 格式化多语言书卷标题显示
 */
export function formatBookHeader(
  bookIndex: number,
  chapter: number,
  activeVersions: VersionId[]
): string {
  const book = BIBLE_BOOKS[bookIndex] || BIBLE_BOOKS[0];
  const parts: string[] = [];

  if (activeVersions.includes('cuv')) {
    parts.push(`${book.nameZh} ${chapter}章`);
  }
  if (activeVersions.includes('kjv')) {
    parts.push(`${book.nameEn.trim()} ${chapter}`);
  }
  if (activeVersions.includes('id_tl')) {
    parts.push(`${book.nameId} ${chapter}`);
  }

  return parts.join(' · ') || `${book.nameZh} ${chapter}章`;
}

/**
 * 投影模式智能自动分页算法：
 * 根据当前勾选的语言版本数量与每节经文的字符长度，将连续多节经文自动拆分为多页，
 * 确保投影屏幕绝不溢出、不截断、无需滚动条。
 */
export function paginateProjectorVerses(
  verses: number[],
  activeVersions: VersionId[],
  getVerseText: (ver: VersionId, vNum: number) => string
): number[][] {
  const sorted = verses.length > 0 ? [...verses].sort((a, b) => a - b) : [1];
  if (sorted.length <= 1) return [sorted];

  // 根据同时展示的译本数量设定单页最大字符预算与单页最大节数
  const versionCount = activeVersions.length;
  const maxVersesPerPage = versionCount === 3 ? 1 : versionCount === 2 ? 2 : 3;
  const maxWeightPerPage = versionCount === 3 ? 260 : versionCount === 2 ? 320 : 280;

  const pages: number[][] = [];
  let currentPage: number[] = [];
  let currentWeight = 0;

  for (const vNum of sorted) {
    let verseWeight = 0;
    for (const ver of activeVersions) {
      const txt = getVerseText(ver, vNum) || '';
      // 中文单字视觉权重约为英文字符的 1.8 倍
      verseWeight += ver === 'cuv' ? txt.length * 1.8 : txt.length;
    }

    if (
      currentPage.length > 0 &&
      (currentPage.length >= maxVersesPerPage || currentWeight + verseWeight > maxWeightPerPage)
    ) {
      pages.push(currentPage);
      currentPage = [vNum];
      currentWeight = verseWeight;
    } else {
      currentPage.push(vNum);
      currentWeight += verseWeight;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

/**
 * 投影单页幻灯片数据结构：
 * 支持多节组合页，也支持单节超长经文按标点自动切分为多个分片 (partIndex / totalParts)
 */
export interface ProjectorSlide {
  verses: number[];
  partIndex?: number; // 1-based 分片序号（仅当单节超长被自动分割时存在）
  totalParts?: number; // 总分片数
  textsByVersion: Record<VersionId, Record<number, string>>;
}

/**
 * 将单节超长经文按自然句读标点（；。？！， / ; . ? ! ,）均匀切分为指定段数，
 * 确保各段长度均衡且不在单词中间硬截断。
 */
export function splitTextIntoBalancedParts(text: string, partsCount: number): string[] {
  const clean = (text || '').trim();
  if (!clean || partsCount <= 1) return [clean];

  // 按中英文常见句读标点切分保留标点
  const segments = clean
    .split(/(?<=[。；！？，、.;!?,:\s])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    // 极端无标点情况按长度均分
    const chunkLen = Math.ceil(clean.length / partsCount);
    const out: string[] = [];
    for (let i = 0; i < partsCount; i++) {
      out.push(clean.slice(i * chunkLen, (i + 1) * chunkLen));
    }
    return out.filter(Boolean);
  }

  const targetLen = clean.length / partsCount;
  const result: string[] = [];
  let current = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLatin = /^[a-zA-Z0-9"'(]/.test(seg) && /[a-zA-Z0-9,;:.?!]$/.test(current);
    const joiner = isLatin ? ' ' : '';

    if (
      current.length > 0 &&
      result.length < partsCount - 1 &&
      current.length + seg.length > targetLen * 1.15
    ) {
      result.push(current.trim());
      current = seg;
    } else {
      current = current ? `${current}${joiner}${seg}` : seg;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result.length > 0 ? result : [clean];
}

/**
 * 基于视口可用高度、字号、排版模式与三语字数自动计算投影分页与超长经文分割
 */
export function buildProjectorSlides(params: {
  verses: number[];
  activeVersions: VersionId[];
  compareLayout: 'stacked' | 'parallel';
  fontSize: number;
  stageWidth: number;
  stageHeight: number;
  getVerseText: (ver: VersionId, vNum: number) => string;
}): ProjectorSlide[] {
  const {
    verses,
    activeVersions,
    compareLayout,
    fontSize,
    stageWidth,
    stageHeight,
    getVerseText,
  } = params;

  const sortedVerses = verses.length > 0 ? [...verses].sort((a, b) => a - b) : [1];
  const versionCount = Math.max(1, activeVersions.length);
  const isParallel = compareLayout === 'parallel' && versionCount > 1 && stageWidth >= 960;

  // 计算有效字号与单行可容纳字符数
  const scale = versionCount === 3 ? 0.78 : versionCount === 2 ? 0.86 : 1;
  const effectiveFontPx = Math.max(20, Math.round(fontSize * scale));
  const lineHeightPx = effectiveFontPx * 1.72;

  // 可用内容区宽度与高度（扣除内边距与译本小标题安全余量）
  const usableHeight = Math.max(200, stageHeight - 96);
  const colWidth = isParallel
    ? Math.max(240, (stageWidth - 160 - (versionCount - 1) * 48) / versionCount)
    : Math.min(960, Math.max(300, stageWidth - 112));

  // 估算单节经文在当前屏宽与字号下所需的垂直像素高度
  const estimateVerseHeight = (vNum: number): number => {
    const heightsPerVersion = activeVersions.map((ver) => {
      const txt = getVerseText(ver, vNum) || '';
      const isZh = ver === 'cuv';
      // 中文含宽字距约占 1.08em/字，拉丁字母平均约占 0.56em/字符
      const charsPerLine = Math.max(
        8,
        Math.floor(colWidth / (effectiveFontPx * (isZh ? 1.08 : 0.56)))
      );
      const lines = Math.max(1, Math.ceil((txt.length + 3) / charsPerLine));
      const headerOverhead = versionCount > 1 ? 28 : 8;
      return lines * lineHeightPx + headerOverhead;
    });

    if (isParallel) {
      // 左右并排时，单节高度取决于最高的那一列译本
      return Math.max(...heightsPerVersion) + 24;
    } else {
      // 上下对照时，单节高度为所有译本高度之和
      return heightsPerVersion.reduce((sum, h) => sum + h, 0) + 28;
    }
  };

  const slides: ProjectorSlide[] = [];
  let pendingVerses: number[] = [];
  let pendingHeight = 0;

  const flushPending = () => {
    if (pendingVerses.length === 0) return;
    const textsByVersion: Record<VersionId, Record<number, string>> = {
      cuv: {},
      kjv: {},
      id_tl: {},
    };
    for (const ver of activeVersions) {
      for (const v of pendingVerses) {
        textsByVersion[ver][v] = getVerseText(ver, v);
      }
    }
    slides.push({
      verses: [...pendingVerses],
      textsByVersion,
    });
    pendingVerses = [];
    pendingHeight = 0;
  };

  for (const vNum of sortedVerses) {
    const vHeight = estimateVerseHeight(vNum);

    // 若单节经文自身高度就超过单页可用高度，则将该节自动分割为多个子页 (1/N, 2/N...)
    if (vHeight > usableHeight) {
      flushPending();
      const partsCount = Math.min(4, Math.max(2, Math.ceil(vHeight / (usableHeight * 0.82))));
      const splitMap: Record<VersionId, string[]> = {
        cuv: [],
        kjv: [],
        id_tl: [],
      };
      for (const ver of activeVersions) {
        splitMap[ver] = splitTextIntoBalancedParts(getVerseText(ver, vNum), partsCount);
      }
      const actualTotalParts = Math.max(
        ...activeVersions.map((ver) => splitMap[ver].length),
        1
      );

      for (let p = 0; p < actualTotalParts; p++) {
        const textsByVersion: Record<VersionId, Record<number, string>> = {
          cuv: {},
          kjv: {},
          id_tl: {},
        };
        for (const ver of activeVersions) {
          const arr = splitMap[ver];
          const chunk = arr[p] ?? arr[arr.length - 1] ?? '';
          const prefix = p > 0 ? '…' : '';
          const suffix = p < actualTotalParts - 1 ? '…' : '';
          textsByVersion[ver][vNum] = `${prefix}${chunk}${suffix}`;
        }
        slides.push({
          verses: [vNum],
          partIndex: p + 1,
          totalParts: actualTotalParts,
          textsByVersion,
        });
      }
      continue;
    }

    // 多节合并时：检查加入当前节后是否超过单页高度或单页最大节数
    const maxVersesPerSlide = versionCount === 3 ? 2 : versionCount === 2 ? 3 : 4;
    if (
      pendingVerses.length > 0 &&
      (pendingHeight + vHeight > usableHeight || pendingVerses.length >= maxVersesPerSlide)
    ) {
      flushPending();
    }

    pendingVerses.push(vNum);
    pendingHeight += vHeight;
  }

  flushPending();
  return slides;
}


/**
 * 30 处教会主日最常用核心经文清单（用于三版本对照抽查与核对）
 */
export const COMMON_30_SCRIPTURES: Array<{
  ref: string;
  theme: string;
  bookIndex: number;
  chapter: number;
  verse: number;
}> = [
  { ref: '创世记 1:1', theme: '创造天地', bookIndex: 0, chapter: 1, verse: 1 },
  { ref: '创世记 1:27', theme: '神的形象', bookIndex: 0, chapter: 1, verse: 27 },
  { ref: '创世记 12:2', theme: '亚伯拉罕之约', bookIndex: 0, chapter: 12, verse: 2 },
  { ref: '出埃及记 20:3', theme: '十诫之首', bookIndex: 1, chapter: 20, verse: 3 },
  { ref: '民数记 6:24', theme: '祭司祝福', bookIndex: 3, chapter: 6, verse: 24 },
  { ref: '申命记 6:4', theme: '以色列听训', bookIndex: 4, chapter: 6, verse: 4 },
  { ref: '约书亚记 1:9', theme: '刚强壮胆', bookIndex: 5, chapter: 1, verse: 9 },
  { ref: '诗篇 1:1', theme: '有福之人', bookIndex: 18, chapter: 1, verse: 1 },
  { ref: '诗篇 23:1', theme: '好牧人（注：TL第1节含大卫诗题）', bookIndex: 18, chapter: 23, verse: 1 },
  { ref: '诗篇 46:1', theme: '避难所与力量', bookIndex: 18, chapter: 46, verse: 1 },
  { ref: '诗篇 119:105', theme: '脚前的灯', bookIndex: 18, chapter: 119, verse: 105 },
  { ref: '箴言 3:5', theme: '专心仰赖耶和华', bookIndex: 19, chapter: 3, verse: 5 },
  { ref: '箴言 4:23', theme: '保守你心', bookIndex: 19, chapter: 4, verse: 23 },
  { ref: '以赛亚书 9:6', theme: '奇妙策士', bookIndex: 22, chapter: 9, verse: 6 },
  { ref: '以赛亚书 40:31', theme: '如鹰展翅上腾', bookIndex: 22, chapter: 40, verse: 31 },
  { ref: '以赛亚书 53:5', theme: '受苦仆人', bookIndex: 22, chapter: 53, verse: 5 },
  { ref: '耶利米书 29:11', theme: '赐平安的意念', bookIndex: 23, chapter: 29, verse: 11 },
  { ref: '弥迦书 6:8', theme: '行公义好怜悯', bookIndex: 32, chapter: 6, verse: 8 },
  { ref: '马太福音 5:3', theme: '八福之首', bookIndex: 39, chapter: 5, verse: 3 },
  { ref: '马太福音 11:28', theme: '得享安息', bookIndex: 39, chapter: 11, verse: 28 },
  { ref: '马太福音 28:19', theme: '大使命', bookIndex: 39, chapter: 28, verse: 19 },
  { ref: '路加福音 2:14', theme: '天使赞美', bookIndex: 41, chapter: 2, verse: 14 },
  { ref: '约翰福音 1:1', theme: '太初有道', bookIndex: 42, chapter: 1, verse: 1 },
  { ref: '约翰福音 3:16', theme: '神爱世人', bookIndex: 42, chapter: 3, verse: 16 },
  { ref: '约翰福音 14:6', theme: '道路真理生命', bookIndex: 42, chapter: 14, verse: 6 },
  { ref: '罗马书 8:28', theme: '万事互相效力', bookIndex: 44, chapter: 8, verse: 28 },
  { ref: '哥林多前书 13:4', theme: '爱的真谛', bookIndex: 45, chapter: 13, verse: 4 },
  { ref: '加拉太书 5:22', theme: '圣灵的果子', bookIndex: 47, chapter: 5, verse: 22 },
  { ref: '以弗所书 2:8', theme: '本乎恩因着信', bookIndex: 48, chapter: 2, verse: 8 },
  { ref: '腓立比书 4:6', theme: '应当一无挂虑', bookIndex: 49, chapter: 4, verse: 6 },
];
