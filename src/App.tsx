/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 微读圣经风格 · 教会主日崇拜与投影圣经阅读器 (App.tsx)
 *
 * 【三个圣经版本的数据来源与授权说明】
 * 1. 英文 (KJV): King James Version (1769)，源自开源圣经库 thiagobodruk/bible (en_kjv.json)，Public Domain（公有领域）。
 * 2. 中文 (CUV): 中文和合本（简体·新标点神版，1919），源自开源圣经库 thiagobodruk/bible (zh_cunpss-shen.json)，Public Domain（公有领域）。
 * 3. 印尼语 (TL): Alkitab Terjemahan Lama (1954)，源自印尼圣经公会 (LAI) 1954年合订版（整合 Klinkert 1879 旧约与 Bode 1938 新约），
 *    依据印尼版权法出版逾50年已进入 Public Domain（公有领域），完整 66 卷，完全免费离线使用。
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  MonitorPlay,
  Sun,
  Moon,
  Columns,
  Rows,
  Check,
  X,
  ListOrdered,
  QrCode,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import {
  BIBLE_BOOKS,
  BIBLE_VERSIONS,
  LANGUAGE_PRESETS,
  VersionId,
  SermonScriptureItem,
  parseBibleReference,
  getAdjacentChapter,
  formatBookHeader,
  formatReferenceLabel,
} from './utils/bibleReference';
import { exportStandaloneUsbBackup } from './utils/offlineBackupExporter';
import { BookChapterSelector } from './components/BookChapterSelector';
import { ProjectorModal } from './components/ProjectorModal';
import { PWAInstallButton, OfflineStatusBanner } from './components/PWAInstallButton';
import { SermonListDrawer } from './components/SermonListDrawer';
import { SyncQrModal } from './components/SyncQrModal';
import { AuditAndAboutModal } from './components/AuditAndAboutModal';

interface RawBibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

interface PersistedReaderState {
  bookIndex: number;
  chapter: number;
  selectedVerses: number[];
  activeVersions: VersionId[];
  compareLayout: 'stacked' | 'parallel';
  fontSize: number;
  darkMode: boolean;
}

const STORAGE_KEY = 'we_bible_reader_v1';
const SERMON_LIST_KEY = 'we_bible_sermon_list_v1';

const DEFAULT_SERMON_LIST: SermonScriptureItem[] = [
  {
    id: 'default-jn-3-16',
    label: '约翰福音 3:16-21',
    bookIndex: 42,
    chapter: 3,
    startVerse: 16,
    endVerse: 21,
  },
  {
    id: 'default-rom-8-28',
    label: '罗马书 8:28-30',
    bookIndex: 44,
    chapter: 8,
    startVerse: 28,
    endVerse: 30,
  },
  {
    id: 'default-ps-23',
    label: '诗篇 23章',
    bookIndex: 18,
    chapter: 23,
    startVerse: 1,
    endVerse: 6,
    isWholeChapter: true,
  },
];

const DEFAULT_STATE: PersistedReaderState = {
  bookIndex: 42, // 约翰福音 (John / Yohanes)
  chapter: 3, // 第 3 章
  selectedVerses: [16], // 默认高亮第 16 节 (约翰福音 3:16)
  activeVersions: ['cuv', 'kjv'],
  compareLayout: 'stacked',
  fontSize: 20, // 默认字号：中 (20px)
  darkMode: false,
};

function loadInitialState(): PersistedReaderState {
  try {
    // 优先检查 URL 扫码参数 (?b=42&c=3&v=16,17)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bParam = params.get('b');
      const cParam = params.get('c');
      const vParam = params.get('v');
      if (bParam !== null && cParam !== null) {
        const bIdx = Math.max(0, Math.min(65, parseInt(bParam, 10) || 0));
        const ch = Math.max(1, parseInt(cParam, 10) || 1);
        const verses = vParam
          ? vParam
              .split(',')
              .map((n) => parseInt(n, 10))
              .filter((n) => !Number.isNaN(n) && n >= 1)
          : [1];
        return {
          ...DEFAULT_STATE,
          bookIndex: bIdx,
          chapter: ch,
          selectedVerses: verses.length > 0 ? verses : [1],
        };
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      bookIndex:
        typeof parsed.bookIndex === 'number' &&
        parsed.bookIndex >= 0 &&
        parsed.bookIndex < BIBLE_BOOKS.length
          ? parsed.bookIndex
          : DEFAULT_STATE.bookIndex,
      chapter:
        typeof parsed.chapter === 'number' && parsed.chapter >= 1
          ? parsed.chapter
          : DEFAULT_STATE.chapter,
      selectedVerses: Array.isArray(parsed.selectedVerses)
        ? parsed.selectedVerses
        : DEFAULT_STATE.selectedVerses,
      activeVersions:
        Array.isArray(parsed.activeVersions) && parsed.activeVersions.length > 0
          ? parsed.activeVersions
          : DEFAULT_STATE.activeVersions,
      compareLayout: parsed.compareLayout === 'parallel' ? 'parallel' : 'stacked',
      fontSize:
        typeof parsed.fontSize === 'number' && parsed.fontSize >= 14 && parsed.fontSize <= 36
          ? parsed.fontSize
          : DEFAULT_STATE.fontSize,
      darkMode: Boolean(parsed.darkMode),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function loadInitialSermonList(): SermonScriptureItem[] {
  try {
    const raw = localStorage.getItem(SERMON_LIST_KEY);
    if (!raw) return DEFAULT_SERMON_LIST;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SERMON_LIST;
  } catch {
    return DEFAULT_SERMON_LIST;
  }
}

export default function App() {
  const initialState = loadInitialState();

  // 阅读器核心状态
  const [bookIndex, setBookIndex] = useState<number>(initialState.bookIndex);
  const [chapter, setChapter] = useState<number>(initialState.chapter);
  const [selectedVerses, setSelectedVerses] = useState<number[]>(initialState.selectedVerses);
  const [activeVersions, setActiveVersions] = useState<VersionId[]>(initialState.activeVersions);
  const [compareLayout, setCompareLayout] = useState<'stacked' | 'parallel'>(
    initialState.compareLayout
  );
  const [fontSize, setFontSize] = useState<number>(initialState.fontSize);
  const [darkMode, setDarkMode] = useState<boolean>(initialState.darkMode);

  // 讲道经文清单状态
  const [sermonList, setSermonList] = useState<SermonScriptureItem[]>(loadInitialSermonList);

  // 房间同步与讲员手机遥控状态
  const [roomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('room');
      if (p) return p;
    }
    return 'sunday-1';
  });
  const [isRemoteControllerMode, setIsRemoteControllerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('mode') === 'remote';
    }
    return false;
  });

  // 本地圣经 JSON 缓存
  const [bibleData, setBibleData] = useState<Partial<Record<VersionId, RawBibleBook[]>>>({});
  const [loadingVersions, setLoadingVersions] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 弹窗控制状态
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [isProjectorOpen, setIsProjectorOpen] = useState<boolean>(false);
  const [isSermonDrawerOpen, setIsSermonDrawerOpen] = useState<boolean>(false);
  const [isSyncQrOpen, setIsSyncQrOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const [quickJumpInput, setQuickJumpInput] = useState<string>('');
  const [quickJumpFeedback, setQuickJumpFeedback] = useState<string | null>(null);

  const verseRefs = useRef<Record<number, HTMLElement | null>>({});
  const isApplyingRemoteRef = useRef<boolean>(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // 同步夜间模式 class 到 <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // 记住上次阅读位置与偏好到 localStorage
  useEffect(() => {
    try {
      const stateToSave: PersistedReaderState = {
        bookIndex,
        chapter,
        selectedVerses,
        activeVersions,
        compareLayout,
        fontSize,
        darkMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }, [bookIndex, chapter, selectedVerses, activeVersions, compareLayout, fontSize, darkMode]);

  // 保存讲道经文清单到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SERMON_LIST_KEY, JSON.stringify(sermonList));
    } catch {
      // ignore
    }
  }, [sermonList]);

  // 预加载全部三个版本的本地 JSON 数据（让离线缓存和校对抽查随时完整可用）
  useEffect(() => {
    let cancelled = false;

    async function loadAllBibles() {
      const allIds: VersionId[] = ['cuv', 'kjv', 'id_tl'];
      const missing = allIds.filter((v) => !bibleData[v]);
      if (missing.length === 0) {
        setLoadingVersions(false);
        return;
      }

      try {
        // 优先加载当前勾选的版本，实现首屏秒开
        const priorityIds = activeVersions.filter((v) => !bibleData[v]);
        if (priorityIds.length > 0) {
          const priorityFetched = await Promise.all(
            priorityIds.map(async (verId) => {
              const meta = BIBLE_VERSIONS.find((v) => v.id === verId)!;
              const res = await fetch(meta.file);
              if (!res.ok) throw new Error(`无法加载本地经文数据: ${meta.file}`);
              const data: RawBibleBook[] = await res.json();
              return [verId, data] as const;
            })
          );

          if (!cancelled) {
            setBibleData((prev) => {
              const next = { ...prev };
              for (const [id, data] of priorityFetched) next[id] = data;
              return next;
            });
            setLoadingVersions(false);
          }
        } else {
          setLoadingVersions(false);
        }

        // 后台静默加载剩余版本，确保 Service Worker 完整缓存全部三语数据
        const remainingIds = allIds.filter(
          (v) => !priorityIds.includes(v) && !bibleData[v]
        );
        if (remainingIds.length > 0) {
          const remainingFetched = await Promise.all(
            remainingIds.map(async (verId) => {
              const meta = BIBLE_VERSIONS.find((v) => v.id === verId)!;
              const res = await fetch(meta.file);
              if (!res.ok) return null;
              const data: RawBibleBook[] = await res.json();
              return [verId, data] as const;
            })
          );

          if (!cancelled) {
            setBibleData((prev) => {
              const next = { ...prev };
              for (const item of remainingFetched) {
                if (item) next[item[0]] = item[1];
              }
              return next;
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : '加载本地圣经 JSON 数据失败');
          setLoadingVersions(false);
        }
      }
    }

    loadAllBibles();
    return () => {
      cancelled = true;
    };
  }, [activeVersions, bibleData]);

  // 广播并同步经文位置（同时支持同设备 BroadcastChannel 与跨设备 /api/sync/:roomId）
  const emitSyncState = useCallback(
    (nextBook: number, nextChapter: number, nextVerses: number[], nextVersions: VersionId[]) => {
      if (isApplyingRemoteRef.current) return;

      const payload = {
        roomId,
        bookIndex: nextBook,
        chapter: nextChapter,
        selectedVerses: nextVerses,
        activeVersions: nextVersions,
      };

      try {
        broadcastChannelRef.current?.postMessage(payload);
      } catch {
        // ignore
      }

      fetch(`/api/sync/${encodeURIComponent(roomId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // 纯静态离线环境时自动静默降级
      });
    },
    [roomId]
  );

  // 订阅实时房间同步流 (SSE + BroadcastChannel)
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`we_bible_sync_${roomId}`);
      bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;
        isApplyingRemoteRef.current = true;
        if (typeof data.bookIndex === 'number') setBookIndex(data.bookIndex);
        if (typeof data.chapter === 'number') setChapter(data.chapter);
        if (Array.isArray(data.selectedVerses)) setSelectedVerses(data.selectedVerses);
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 50);
      };
      broadcastChannelRef.current = bc;
    }

    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/sync/${encodeURIComponent(roomId)}/stream`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          isApplyingRemoteRef.current = true;
          if (typeof data.bookIndex === 'number') setBookIndex(data.bookIndex);
          if (typeof data.chapter === 'number') setChapter(data.chapter);
          if (Array.isArray(data.selectedVerses)) setSelectedVerses(data.selectedVerses);
          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 50);
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore offline
    }

    return () => {
      broadcastChannelRef.current?.close();
      es?.close();
    };
  }, [roomId]);

  // 获取指定书卷与章的总节数
  const getVerseCount = useCallback(
    (bIdx: number, chNum: number): number => {
      for (const verId of activeVersions) {
        const books = bibleData[verId];
        const ch = books?.[bIdx]?.chapters?.[chNum - 1];
        if (ch && ch.length > 0) return ch.length;
      }
      for (const books of Object.values(bibleData)) {
        const ch = books?.[bIdx]?.chapters?.[chNum - 1];
        if (ch && ch.length > 0) return ch.length;
      }
      return 30;
    },
    [activeVersions, bibleData]
  );

  // 获取单节经文内容
  const getVerseText = useCallback(
    (verId: VersionId, bIdx: number, chNum: number, vNum: number): string => {
      const books = bibleData[verId];
      if (!books) return '正在加载本地经文…';
      return books[bIdx]?.chapters?.[chNum - 1]?.[vNum - 1] || '';
    },
    [bibleData]
  );

  const totalVersesInChapter = getVerseCount(bookIndex, chapter);
  const currentBook = BIBLE_BOOKS[bookIndex] || BIBLE_BOOKS[0];

  // 滚动到指定节数
  const scrollToVerse = useCallback((vNum: number) => {
    setTimeout(() => {
      const el = verseRefs.current[vNum];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  }, []);

  // 选择书卷、章、节跳转
  const handleSelectDestination = (bIdx: number, chNum: number, vNum?: number) => {
    setBookIndex(bIdx);
    setChapter(chNum);
    const nextVerses = vNum && vNum >= 1 ? [vNum] : [];
    setSelectedVerses(nextVerses);
    emitSyncState(bIdx, chNum, nextVerses.length ? nextVerses : [1], activeVersions);
    if (vNum && vNum >= 1) {
      scrollToVerse(vNum);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 处理快速跳转输入（支持连续节选如 "约3:16-21"、"罗8:28-30"、"诗23"）
  const handleQuickJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickJumpInput.trim()) return;

    const parsed = parseBibleReference(quickJumpInput);
    if (!parsed) {
      setQuickJumpFeedback('未识别该书卷或格式，请尝试输入如“约3:16-21”或“John 3:16”');
      return;
    }

    setQuickJumpFeedback(null);
    setBookIndex(parsed.bookIndex);
    setChapter(parsed.chapter);

    const maxVerse = getVerseCount(parsed.bookIndex, parsed.chapter);
    if (parsed.isWholeChapter) {
      setSelectedVerses([1]);
      emitSyncState(parsed.bookIndex, parsed.chapter, [1], activeVersions);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const startV = Math.min(parsed.verse, maxVerse);
    const endV = Math.min(parsed.endVerse, maxVerse);
    const range: number[] = [];
    for (let v = startV; v <= endV; v++) {
      range.push(v);
    }
    setSelectedVerses(range);
    emitSyncState(parsed.bookIndex, parsed.chapter, range, activeVersions);
    scrollToVerse(startV);
  };

  // 从讲道经文清单点选某一项
  const handleSelectSermonItem = (item: SermonScriptureItem, openProjector: boolean) => {
    setBookIndex(item.bookIndex);
    setChapter(item.chapter);
    const maxV = getVerseCount(item.bookIndex, item.chapter);

    let range: number[] = [];
    if (item.isWholeChapter) {
      range = [1];
    } else {
      const startV = Math.min(item.startVerse, maxV);
      const endV = Math.min(item.endVerse, maxV);
      for (let v = startV; v <= endV; v++) {
        range.push(v);
      }
    }

    setSelectedVerses(range);
    emitSyncState(item.bookIndex, item.chapter, range, activeVersions);
    scrollToVerse(range[0] || 1);

    if (openProjector) {
      setIsProjectorOpen(true);
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  };

  // 将当前高亮的经文加入讲道清单
  const handleAddCurrentToSermonList = () => {
    const sorted = selectedVerses.length > 0 ? [...selectedVerses].sort((a, b) => a - b) : [1];
    const startV = sorted[0];
    const endV = sorted[sorted.length - 1];
    const newItem: SermonScriptureItem = {
      id: `${bookIndex}-${chapter}-${startV}-${endV}-${Date.now()}`,
      label: formatReferenceLabel(bookIndex, chapter, startV, endV),
      bookIndex,
      chapter,
      startVerse: startV,
      endVerse: endV,
    };
    setSermonList((prev) => [...prev, newItem]);
  };

  // 切换版本勾选（至少保留 1 个版本）
  const handleToggleVersion = (verId: VersionId) => {
    setActiveVersions((prev) => {
      if (prev.includes(verId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== verId);
      } else {
        const order: VersionId[] = ['cuv', 'kjv', 'id_tl'];
        const next = [...prev, verId];
        return order.filter((id) => next.includes(id));
      }
    });
  };

  // 点击某一节高亮或取消高亮
  const handleVerseClick = (vNum: number) => {
    setSelectedVerses((prev) => {
      const next = prev.includes(vNum)
        ? prev.filter((v) => v !== vNum)
        : [...prev, vNum].sort((a, b) => a - b);
      emitSyncState(bookIndex, chapter, next.length ? next : [vNum], activeVersions);
      return next;
    });
  };

  // 上一章 / 下一章切换
  const handleChapterStep = (direction: 'prev' | 'next') => {
    const nextPos = getAdjacentChapter(bookIndex, chapter, direction);
    setBookIndex(nextPos.bookIndex);
    setChapter(nextPos.chapter);
    setSelectedVerses([]);
    emitSyncState(nextPos.bookIndex, nextPos.chapter, [1], activeVersions);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 投影模式或遥控器按上一节/下一节（支持跨章）
  const handleProjectorStepVerse = useCallback(
    (direction: 'prev' | 'next') => {
      const currentV =
        selectedVerses.length > 0
          ? direction === 'next'
            ? Math.max(...selectedVerses)
            : Math.min(...selectedVerses)
          : 1;
      const maxV = getVerseCount(bookIndex, chapter);

      if (direction === 'next') {
        if (currentV < maxV) {
          const nextV = currentV + 1;
          setSelectedVerses([nextV]);
          emitSyncState(bookIndex, chapter, [nextV], activeVersions);
          scrollToVerse(nextV);
        } else {
          const nextPos = getAdjacentChapter(bookIndex, chapter, 'next');
          setBookIndex(nextPos.bookIndex);
          setChapter(nextPos.chapter);
          setSelectedVerses([1]);
          emitSyncState(nextPos.bookIndex, nextPos.chapter, [1], activeVersions);
        }
      } else {
        if (currentV > 1) {
          const prevV = currentV - 1;
          setSelectedVerses([prevV]);
          emitSyncState(bookIndex, chapter, [prevV], activeVersions);
          scrollToVerse(prevV);
        } else {
          const prevPos = getAdjacentChapter(bookIndex, chapter, 'prev');
          const prevMaxV = getVerseCount(prevPos.bookIndex, prevPos.chapter);
          setBookIndex(prevPos.bookIndex);
          setChapter(prevPos.chapter);
          setSelectedVerses([prevMaxV]);
          emitSyncState(prevPos.bookIndex, prevPos.chapter, [prevMaxV], activeVersions);
        }
      }
    },
    [bookIndex, chapter, selectedVerses, activeVersions, getVerseCount, scrollToVerse, emitSyncState]
  );

  // 开启全屏投影模式
  const handleOpenProjector = () => {
    if (selectedVerses.length === 0) {
      setSelectedVerses([1]);
    }
    setIsProjectorOpen(true);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  const handleCloseProjector = () => {
    setIsProjectorOpen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  // 一键导出 U 盘离线备份 HTML
  const handleExportUsbBackup = () => {
    exportStandaloneUsbBackup({
      bookIndex,
      chapter,
      selectedVerses,
      sermonList,
      bibleData,
    });
  };

  const prevChapterPos = getAdjacentChapter(bookIndex, chapter, 'prev');
  const nextChapterPos = getAdjacentChapter(bookIndex, chapter, 'next');

  const sortedSelected =
    selectedVerses.length > 0 ? [...selectedVerses].sort((a, b) => a - b) : [1];
  const currentRefLabel = formatReferenceLabel(
    bookIndex,
    chapter,
    sortedSelected[0],
    sortedSelected[sortedSelected.length - 1]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] dark:bg-[#141413] text-stone-900 dark:text-stone-100 transition-colors">
      <OfflineStatusBanner />

      {/* 顶部微读风格导航与书卷章节选择栏 */}
      <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 dark:bg-[#141413]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2.5">
          {/* 左侧：当前书卷章节选择器 */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsSelectorOpen(true)}
              aria-label="打开圣经书卷章节目录"
              className="group flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 shadow-2xs transition-colors cursor-pointer min-h-[40px]"
            >
              <BookOpen className="w-4 h-4 text-amber-800 dark:text-amber-500 shrink-0" />
              <span className="font-semibold text-sm sm:text-base tracking-tight truncate">
                {currentBook.nameZh} 第 {chapter} 章
              </span>
              <span className="hidden lg:inline text-xs text-stone-500 dark:text-stone-400 font-latin-serif">
                · {currentBook.nameEn.trim()} {chapter}
              </span>
              <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 shrink-0" />
            </button>
          </div>

          {/* 中间：快速输入经文跳转栏（支持如 约3:16-21） */}
          <form
            onSubmit={handleQuickJumpSubmit}
            className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm relative"
          >
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={quickJumpInput}
              onChange={(e) => {
                setQuickJumpInput(e.target.value);
                if (quickJumpFeedback) setQuickJumpFeedback(null);
              }}
              placeholder="输入跳转：约3:16-21 / John 3:16"
              aria-label="输入经文引文快速跳转"
              className="w-full pl-9 pr-14 py-1.5 min-h-[40px] text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-700 dark:focus:border-amber-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            >
              跳转
            </button>
          </form>

          {/* 右侧：讲道清单 + 扫码遥控 + 校对/关于 + PWA安装 + 日夜 + 投影模式 */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSermonDrawerOpen(true)}
              title="主日讲道经文清单（支持提前备课与拖拽排序）"
              className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-stone-700 dark:text-stone-200 flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <ListOrdered className="w-4 h-4 text-amber-800 dark:text-amber-500 shrink-0" />
              <span className="hidden sm:inline">讲道清单</span>
              <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                ({sermonList.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsSyncQrOpen(true)}
              title="生成会众同步跟读二维码 / 讲员手机遥控二维码"
              className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-stone-700 dark:text-stone-200 flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <QrCode className="w-4 h-4 text-stone-600 dark:text-stone-300 shrink-0" />
              <span className="hidden xl:inline">扫码/遥控</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              title="经文完整性校对、30处抽查、版本授权与牧师保障材料"
              className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-stone-700 dark:text-stone-200 flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">校对与关于</span>
            </button>

            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? '切换到日间模式' : '切换到夜间模式'}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 text-stone-700 dark:text-stone-200 flex items-center gap-1 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600" />
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenProjector}
              className="min-h-[40px] px-3 sm:px-4 py-1.5 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-400 font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <MonitorPlay className="w-4 h-4 shrink-0" />
              <span>投影模式</span>
            </button>
          </div>
        </div>
      </header>

      {/* 讲员手机遥控面板（当扫码进入 ?mode=remote 或点击开启遥控器时显示） */}
      {isRemoteControllerMode && (
        <section
          aria-label="讲员手机遥控面板"
          className="bg-stone-900 text-white border-b border-stone-800 px-4 py-4"
        >
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-400">
                <Radio className="w-4 h-4" />
                <span>讲员手机遥控模式（实时同步控制投影大屏 · 房间 {roomId}）</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRemoteControllerMode(false)}
                className="text-xs text-stone-400 hover:text-white cursor-pointer"
              >
                收起遥控板
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleProjectorStepVerse('prev')}
                className="min-h-[54px] rounded-xl bg-stone-800 hover:bg-stone-700 font-semibold text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>上一节</span>
              </button>
              <button
                type="button"
                onClick={() => handleProjectorStepVerse('next')}
                className="min-h-[54px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>下一节</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {sermonList.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1">
                <span className="text-xs text-stone-400 shrink-0">讲道清单快切:</span>
                {sermonList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSermonItem(item, false)}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium whitespace-nowrap cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 二级工具栏：手机端快跳输入 + 语言组合快捷切换 + 版本多选 + 对照排版 + 字号调节 */}
      <section
        aria-label="阅读器设置与版本切换"
        className="border-b border-stone-200/60 dark:border-stone-800/80 bg-[#F7F4EE]/70 dark:bg-[#181716]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col gap-2.5">
          {/* 手机端显示的经文快速跳转输入框 */}
          <form onSubmit={handleQuickJumpSubmit} className="flex md:hidden items-center relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={quickJumpInput}
              onChange={(e) => {
                setQuickJumpInput(e.target.value);
                if (quickJumpFeedback) setQuickJumpFeedback(null);
              }}
              placeholder="输入经文跳转，如：约3:16-21"
              aria-label="手机端经文快速跳转"
              className="w-full pl-9 pr-16 py-2 text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-700 dark:focus:border-amber-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              跳转
            </button>
          </form>

          {quickJumpFeedback && (
            <div className="text-xs text-amber-800 dark:text-amber-400 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg px-3 py-1.5">
              <span>{quickJumpFeedback}</span>
              <button
                type="button"
                onClick={() => setQuickJumpFeedback(null)}
                className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 语言显示快捷组合（只中文 / 中英 / 中印 / 三语）+ 自由勾选 */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-0.5 rounded-lg bg-stone-200/80 dark:bg-stone-800 border border-stone-300/60 dark:border-stone-700">
                {LANGUAGE_PRESETS.map((preset) => {
                  const isMatch =
                    preset.versions.length === activeVersions.length &&
                    preset.versions.every((v) => activeVersions.includes(v));
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setActiveVersions(preset.versions)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        isMatch
                          ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-stone-300 dark:text-stone-700 hidden sm:inline">|</span>

              {BIBLE_VERSIONS.map((ver) => {
                const checked = activeVersions.includes(ver.id);
                return (
                  <button
                    key={ver.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => handleToggleVersion(ver.id)}
                    title={`${ver.name} — ${ver.license}`}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      checked
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                        checked
                          ? 'border-transparent bg-amber-500 text-stone-950'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{ver.nativeName}</span>
                  </button>
                );
              })}

              {/* 当勾选 >= 2 个版本时，显示“上下对照 / 左右并排”切换按钮 */}
              {activeVersions.length > 1 && (
                <div className="flex items-center p-0.5 rounded-lg bg-stone-200/80 dark:bg-stone-800 border border-stone-300/60 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setCompareLayout('stacked')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                      compareLayout === 'stacked'
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    <Rows className="w-3.5 h-3.5" />
                    <span>上下对照</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareLayout('parallel')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                      compareLayout === 'parallel'
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>左右并排</span>
                  </button>
                </div>
              )}
            </div>

            {/* 字号调节（小 / 中 / 大 按钮 + 滑杆） */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-stone-400">字号:</span>
              <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-lg">
                {(
                  [
                    { label: '小', size: 16 },
                    { label: '中', size: 20 },
                    { label: '大', size: 26 },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFontSize(preset.size)}
                    aria-label={`字号${preset.label}`}
                    className={`min-h-[28px] px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      fontSize === preset.size
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={15}
                max={32}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                aria-label="字号大小滑杆"
                className="w-20 sm:w-24 accent-stone-800 dark:accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 主体经文阅读区域（微读圣经极简留白排版） */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {/* 书卷与章节大标题 */}
        <div className="mb-8 pb-6 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 tracking-widest uppercase">
              {currentBook.testament === 'OT'
                ? '旧约圣经 · Old Testament'
                : '新约圣经 · New Testament'}{' '}
              · {currentBook.category}
            </div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 mt-1.5">
              {formatBookHeader(bookIndex, chapter, activeVersions)}
            </h1>
          </div>

          {/* 讲道高亮状态提示与快速操作 */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            {selectedVerses.length > 0 ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm bg-amber-900/10 dark:bg-amber-500/15 text-amber-950 dark:text-amber-200 border border-amber-800/30 dark:border-amber-500/30 px-3 py-1.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => scrollToVerse(selectedVerses[0])}
                  title="点击定位到高亮经文"
                  className="hover:underline cursor-pointer"
                >
                  已高亮第{' '}
                  <strong className="tabular-nums">
                    {selectedVerses.length > 3
                      ? `${selectedVerses[0]}-${selectedVerses[selectedVerses.length - 1]}`
                      : selectedVerses.join(', ')}
                  </strong>{' '}
                  节
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleOpenProjector}
                  className="underline font-medium hover:opacity-80 cursor-pointer"
                >
                  直接投射
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleAddCurrentToSermonList}
                  className="hover:underline cursor-pointer"
                >
                  存为清单
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedVerses([])}
                  className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                >
                  清除
                </button>
              </div>
            ) : (
              <span className="text-xs text-stone-400 dark:text-stone-500">
                提示：点击经文可高亮标记，或输入“约3:16-21”连续节选并投射
              </span>
            )}
          </div>
        </div>

        {/* 加载状态或错误提示 */}
        {loadError && (
          <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-sm">
            {loadError}
          </div>
        )}

        {loadingVersions && Object.keys(bibleData).length === 0 ? (
          <div className="py-20 text-center text-stone-500 dark:text-stone-400 text-base">
            正在加载本地离线圣经数据（KJV / 和合本 / 印尼语 TL）…
          </div>
        ) : (
          /* 经文列表：支持左右并排对照或上下逐节对照 */
          <div className="space-y-2">
            {compareLayout === 'parallel' && activeVersions.length > 1 && (
              <div
                className={`hidden md:grid gap-6 pb-3 mb-2 border-b border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-500 dark:text-stone-400 tracking-wide ${
                  activeVersions.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
                }`}
              >
                {activeVersions.map((verId) => {
                  const meta = BIBLE_VERSIONS.find((v) => v.id === verId)!;
                  return (
                    <div key={verId} className="truncate">
                      {meta.name} · Public Domain
                    </div>
                  );
                })}
              </div>
            )}

            {Array.from({ length: totalVersesInChapter }, (_, idx) => idx + 1).map((vNum) => {
              const isHighlighted = selectedVerses.includes(vNum);

              return (
                <article
                  key={vNum}
                  ref={(el) => {
                    verseRefs.current[vNum] = el;
                  }}
                  onClick={() => handleVerseClick(vNum)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isHighlighted}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleVerseClick(vNum);
                    }
                  }}
                  className={`group rounded-xl px-4 py-3.5 transition-colors cursor-pointer border ${
                    isHighlighted
                      ? 'bg-amber-900/[0.08] dark:bg-amber-400/[0.12] border-amber-800/35 dark:border-amber-400/40'
                      : 'bg-transparent border-transparent hover:bg-stone-200/40 dark:hover:bg-stone-900/60'
                  }`}
                >
                  {compareLayout === 'parallel' && activeVersions.length > 1 ? (
                    <div
                      className={`grid grid-cols-1 gap-4 md:gap-8 items-baseline ${
                        activeVersions.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
                      }`}
                    >
                      {activeVersions.map((verId) => {
                        const meta = BIBLE_VERSIONS.find((v) => v.id === verId)!;
                        const isZh = meta.lang === 'zh';
                        const text = getVerseText(verId, bookIndex, chapter, vNum);

                        return (
                          <div key={verId} className="min-w-0">
                            <p
                              style={{
                                fontSize: `${fontSize}px`,
                                lineHeight: isZh ? 1.85 : 1.7,
                              }}
                              className={`${
                                isZh ? 'font-zh-serif' : 'font-latin-serif'
                              } text-stone-900 dark:text-stone-100 break-words`}
                            >
                              <span
                                className={`inline-block font-sans text-xs sm:text-sm font-semibold mr-2 tabular-nums select-none ${
                                  isHighlighted
                                    ? 'text-amber-800 dark:text-amber-400'
                                    : 'text-stone-400 dark:text-stone-500'
                                }`}
                              >
                                {vNum}
                              </span>
                              {text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-w-3xl">
                      {activeVersions.map((verId, verIdx) => {
                        const meta = BIBLE_VERSIONS.find((v) => v.id === verId)!;
                        const isZh = meta.lang === 'zh';
                        const text = getVerseText(verId, bookIndex, chapter, vNum);

                        return (
                          <p
                            key={verId}
                            style={{
                              fontSize: `${verIdx === 0 ? fontSize : Math.max(14, fontSize - 1)}px`,
                              lineHeight: isZh ? 1.85 : 1.7,
                            }}
                            className={`${
                              isZh ? 'font-zh-serif' : 'font-latin-serif'
                            } ${
                              verIdx === 0
                                ? 'text-stone-900 dark:text-stone-100'
                                : 'text-stone-700 dark:text-stone-300'
                            } break-words`}
                          >
                            {verIdx === 0 ? (
                              <span
                                className={`inline-block font-sans text-xs sm:text-sm font-semibold mr-2.5 tabular-nums select-none ${
                                  isHighlighted
                                    ? 'text-amber-800 dark:text-amber-400'
                                    : 'text-stone-400 dark:text-stone-500'
                                }`}
                              >
                                {vNum}
                              </span>
                            ) : (
                              <span className="inline-block font-sans text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500 mr-2 select-none">
                                [{meta.shortName}]
                              </span>
                            )}
                            {text}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* 底部上一章 / 下一章切换栏 */}
        <nav
          aria-label="章节翻页导航"
          className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4"
        >
          <button
            type="button"
            onClick={() => handleChapterStep('prev')}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-stone-800 dark:text-stone-200 flex items-center gap-2.5 text-sm sm:text-base font-medium transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-stone-400 shrink-0" />
            <div className="text-left">
              <div className="text-[11px] text-stone-400 dark:text-stone-500">上一章</div>
              <div>
                {BIBLE_BOOKS[prevChapterPos.bookIndex].nameZh} 第 {prevChapterPos.chapter} 章
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsSelectorOpen(true)}
            className="hidden sm:flex min-h-[48px] px-4 py-2.5 rounded-xl text-xs sm:text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>目录选章</span>
          </button>

          <button
            type="button"
            onClick={() => handleChapterStep('next')}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-stone-800 dark:text-stone-200 flex items-center gap-2.5 text-sm sm:text-base font-medium transition-colors cursor-pointer"
          >
            <div className="text-right">
              <div className="text-[11px] text-stone-400 dark:text-stone-500">下一章</div>
              <div>
                {BIBLE_BOOKS[nextChapterPos.bookIndex].nameZh} 第 {nextChapterPos.chapter} 章
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
          </button>
        </nav>

        {/* 页脚：离线可用、版本授权与一键备份入口 */}
        <footer className="mt-12 pt-6 border-t border-stone-200/50 dark:border-stone-800/50 text-xs text-stone-400 dark:text-stone-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            全本地离线经文数据 · 中文和合本 (CUV 1919) · 英文 King James Version (KJV 1769) · 印尼语 Alkitab Terjemahan Lama (TL 1954)
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="hover:text-stone-700 dark:hover:text-stone-200 underline cursor-pointer"
            >
              66卷校对报告 & 版权说明
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={handleExportUsbBackup}
              className="hover:text-stone-700 dark:hover:text-stone-200 underline cursor-pointer"
            >
              一键导出U盘离线备份版
            </button>
          </div>
        </footer>
      </main>

      {/* 书卷 → 章 → 节 选择器弹窗 */}
      <BookChapterSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        currentBookIndex={bookIndex}
        currentChapter={chapter}
        getVerseCount={getVerseCount}
        onSelectDestination={handleSelectDestination}
      />

      {/* 主日讲道经文清单抽屉 */}
      <SermonListDrawer
        isOpen={isSermonDrawerOpen}
        onClose={() => setIsSermonDrawerOpen(false)}
        items={sermonList}
        onUpdateItems={setSermonList}
        onSelectItem={handleSelectSermonItem}
        onAddCurrentSelection={handleAddCurrentToSermonList}
        currentSelectionLabel={currentRefLabel}
        onExportOfflineBackup={handleExportUsbBackup}
      />

      {/* 会众扫码同步跟读 & 讲员手机遥控二维码弹窗 */}
      <SyncQrModal
        isOpen={isSyncQrOpen}
        onClose={() => setIsSyncQrOpen(false)}
        roomId={roomId}
        currentRefLabel={currentRefLabel}
        bookIndex={bookIndex}
        chapter={chapter}
        selectedVerses={selectedVerses}
        onSwitchToRemoteControllerMode={() => setIsRemoteControllerMode(true)}
      />

      {/* 经文校对、30处抽查、关于版本授权与说服牧师材料弹窗 */}
      <AuditAndAboutModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        bibleData={bibleData}
        getVerseText={getVerseText}
        onJumpToScripture={(b, c, v) => handleSelectDestination(b, c, v)}
        onExportOfflineBackup={handleExportUsbBackup}
      />

      {/* 教会全屏黑底白字投影模式 */}
      <ProjectorModal
        isOpen={isProjectorOpen}
        onClose={handleCloseProjector}
        bookIndex={bookIndex}
        chapter={chapter}
        activeVerses={selectedVerses}
        totalVersesInChapter={totalVersesInChapter}
        activeVersions={activeVersions}
        onSetActiveVersions={setActiveVersions}
        compareLayout={compareLayout}
        onToggleCompareLayout={() =>
          setCompareLayout((m) => (m === 'stacked' ? 'parallel' : 'stacked'))
        }
        getVerseText={getVerseText}
        onStepVerse={handleProjectorStepVerse}
      />
    </div>
  );
}
