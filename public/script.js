/**
 * ==========================================================================
 * 微读圣经风格 · 教会礼拜与投影阅读器 (script.js - 纯原生 JS 架构参考版)
 *
 * 【三个圣经版本的数据来源与授权说明】
 * 1. 英文 (KJV): King James Version (1769)
 *    - 来源: 开源圣经库 thiagobodruk/bible (data/kjv.json)
 *    - 授权: Public Domain（公有领域），完全免费，无需 API 密钥。
 *
 * 2. 中文 (CUV): 中文和合本（简体·新标点神版，1919）
 *    - 来源: 开源圣经库 thiagobodruk/bible (data/cuv.json)
 *    - 授权: Public Domain（公有领域），完全免费离线使用。
 *
 * 3. 印尼语 (TL): Alkitab Terjemahan Lama (1954)
 *    - 来源: 印尼圣经公会 (LAI) 1954年合订版，完整 66 卷 (data/id_tl.json)
 *    - 授权: 依据印尼版权法出版逾50年已进入 Public Domain（公有领域），可免费用于礼拜与投影。
 * ==========================================================================
 */

// 完整应用由主入口挂载并共用 /data/cuv.json、/data/kjv.json、/data/id_tl.json 离线数据
window.BIBLE_DATA_SOURCES = {
  cuv: { file: '/data/cuv.json', license: 'Public Domain (1919)' },
  kjv: { file: '/data/kjv.json', license: 'Public Domain (1769)' },
  id_tl: { file: '/data/id_tl.json', license: 'Public Domain (1954)' },
};
