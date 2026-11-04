/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 教会全屏投影模式组件 (ProjectorModal.tsx)
 * 升级特性：
 * 1. 动态单页高度检测与自动分割机制：
 *    - 通过 ResizeObserver 实时测量投影舞台可用宽高 (stageWidth / stageHeight)
 *    - 调用 buildProjectorSlides 自动计算：若多节经文或单节超长经文超过单页高度，自动按句读标点均匀分割为多页 (如 第9节 1/2、2/2)
 *    - 二级真实 DOM 溢出保护 (autoFitScale)：若极端字号下渲染高度仍超出视口，自动微调字号缩放比，确保 100% 单屏完整显示、无滚动条截断
 * 2. 三语对照视觉比例平衡与充足字距：
 *    - 中文 (CUV) 采用 1.0x 基准字号 + 0.045em 宽松字距 + 1.75 行高
 *    - 英文 (KJV) 与印尼语 (TL) 采用 0.92x 光学平衡衬线字号 + 0.02em 字距 + 0.05em 词距 + 1.65 行高，使三语视觉重心均衡一致
 */

import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Columns,
  Rows,
  Minus,
  Plus,
  Contrast,
} from 'lucide-react';
import {
  BIBLE_BOOKS,
  BIBLE_VERSIONS,
  LANGUAGE_PRESETS,
  VersionId,
  buildProjectorSlides,
} from '../utils/bibleReference';

interface ProjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookIndex: number;
  chapter: number;
  activeVerses: number[]; // 1-based selected verses
  totalVersesInChapter: number;
  activeVersions: VersionId[];
  onSetActiveVersions: (versions: VersionId[]) => void;
  compareLayout: 'stacked' | 'parallel';
  onToggleCompareLayout: () => void;
  getVerseText: (version: VersionId, bookIndex: number, chapter: number, verse: number) => string;
  onStepVerse: (direction: 'prev' | 'next') => void;
}

export const ProjectorModal: React.FC<ProjectorModalProps> = ({
  isOpen,
  onClose,
  bookIndex,
  chapter,
  activeVerses,
  totalVersesInChapter,
  activeVersions,
  onSetActiveVersions,
  compareLayout,
  onToggleCompareLayout,
  getVerseText,
  onStepVerse,
}) => {
  const [projectorFontSize, setProjectorFontSize] = useState<number>(38);
  const [projectorTheme, setProjectorTheme] = useState<'pure_black' | 'deep_slate'>('pure_black');
  const [pageIndex, setPageIndex] = useState<number>(0);

  // 实时监测投影舞台容器的真实像素宽高，用于精确计算单页可容纳高度
  const stageRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight - 140 : 760,
  });
  // 二级真实 DOM 高度自适应缩放系数（当单页渲染内容接近容器边缘时自动微调，确保绝不出现滚动条）
  const [autoFitScale, setAutoFitScale] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) return;
    const el = stageRef.current;
    if (!el) return;

    const updateDimensions = () => {
      if (!stageRef.current) return;
      setStageSize({
        width: stageRef.current.clientWidth || window.innerWidth,
        height: stageRef.current.clientHeight || window.innerHeight - 140,
      });
    };

    updateDimensions();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateDimensions);
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [isOpen]);

  const sortedVerses = useMemo(
    () => (activeVerses.length > 0 ? [...activeVerses].sort((a, b) => a - b) : [1]),
    [activeVerses]
  );

  // 自动计算分页与长经文分割：超过单页高度时自动拆分为多页幻灯片
  const slides = useMemo(() => {
    return buildProjectorSlides({
      verses: sortedVerses,
      activeVersions,
      compareLayout,
      fontSize: projectorFontSize,
      stageWidth: stageSize.width,
      stageHeight: stageSize.height,
      getVerseText: (ver, vNum) => getVerseText(ver, bookIndex, chapter, vNum),
    });
  }, [
    sortedVerses,
    activeVersions,
    compareLayout,
    projectorFontSize,
    stageSize.width,
    stageSize.height,
    bookIndex,
    chapter,
    getVerseText,
  ]);

  // 当选中经文或版本变化时，重置到第一页
  useEffect(() => {
    setPageIndex(0);
  }, [bookIndex, chapter, sortedVerses.join(','), activeVersions.join(','), compareLayout]);

  const safePageIndex = Math.min(pageIndex, Math.max(0, slides.length - 1));
  const currentSlide = slides[safePageIndex] || {
    verses: [sortedVerses[0] || 1],
    textsByVersion: { cuv: {}, kjv: {}, id_tl: {} },
  };
  const currentPageVerses = currentSlide.verses;

  // 二级真实 DOM 测量：切换页面或字号时，先重置 autoFitScale=1，若实际 DOM 高度超出舞台则按比例自适应收缩
  useEffect(() => {
    setAutoFitScale(1);
  }, [
    safePageIndex,
    projectorFontSize,
    stageSize.width,
    stageSize.height,
    activeVersions.join(','),
    compareLayout,
  ]);

  useLayoutEffect(() => {
    if (!isOpen || !stageRef.current || !contentRef.current) return;
    const availableH = stageRef.current.clientHeight - 56;
    const actualH = contentRef.current.scrollHeight;
    if (actualH > availableH && availableH > 120 && autoFitScale > 0.72) {
      const ratio = Math.max(0.72, Math.min(0.95, (availableH / actualH) * 0.96));
      setAutoFitScale((prev) => Number((prev * ratio).toFixed(2)));
    }
  }, [
    isOpen,
    safePageIndex,
    slides,
    autoFitScale,
    stageSize.height,
  ]);

  // 处理翻页/翻节：若当前经文被拆分为多页，先在分页间推进；到最后一页后再推进到下一节
  const handleStep = useCallback(
    (direction: 'prev' | 'next') => {
      if (direction === 'next') {
        if (safePageIndex < slides.length - 1) {
          setPageIndex((p) => p + 1);
        } else {
          onStepVerse('next');
        }
      } else {
        if (safePageIndex > 0) {
          setPageIndex((p) => p - 1);
        } else {
          onStepVerse('prev');
        }
      }
    },
    [safePageIndex, slides.length, onStepVerse]
  );

  // 监听键盘方向键、空格键、无线翻页笔 (PageUp / PageDown) 与 Esc 键
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        e.preventDefault();
        handleStep('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handleStep('prev');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleStep, onClose]);

  if (!isOpen) return null;

  const book = BIBLE_BOOKS[bookIndex] || BIBLE_BOOKS[0];
  const fullRangeLabel =
    sortedVerses.length === 1
      ? `${sortedVerses[0]}`
      : `${sortedVerses[0]}-${sortedVerses[sortedVerses.length - 1]}`;
  const pageRangeLabel =
    currentPageVerses.length === 1
      ? `${currentPageVerses[0]}${
          currentSlide.totalParts && currentSlide.totalParts > 1
            ? ` (${currentSlide.partIndex}/${currentSlide.totalParts})`
            : ''
        }`
      : `${currentPageVerses[0]}-${currentPageVerses[currentPageVerses.length - 1]}`;

  // 根据版本数、当页节数与 DOM 自适应缩放比计算基准字号
  const baseScale =
    activeVersions.length === 3
      ? 0.78
      : activeVersions.length === 2
      ? 0.86
      : currentPageVerses.length > 1
      ? 0.86
      : 1;
  const effectiveBaseFontSize = Math.max(
    18,
    Math.round(projectorFontSize * baseScale * autoFitScale)
  );

  // 为不同语系计算光学平衡的字号、字距与行高（使中文方块字与英文/印尼文拉丁字母视觉比重均衡）
  const getLanguageTypographyStyle = (lang: 'zh' | 'en' | 'id'): React.CSSProperties => {
    if (lang === 'zh') {
      return {
        fontSize: `${effectiveBaseFontSize}px`,
        lineHeight: 1.75,
        letterSpacing: '0.045em',
      };
    }
    // 英文与印尼语采用 0.92x 光学字号配比，并增加字距与词距，避免多语言同屏时拉丁文显得拥挤
    return {
      fontSize: `${Math.max(17, Math.round(effectiveBaseFontSize * 0.92))}px`,
      lineHeight: 1.65,
      letterSpacing: '0.02em',
      wordSpacing: '0.05em',
    };
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between select-none overflow-hidden transition-colors ${
        projectorTheme === 'pure_black'
          ? 'bg-black text-white'
          : 'bg-[#0F141C] text-[#F1F5F9]'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="全屏投影模式"
    >
      {/* 顶部极简投影控制栏 */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-6 sm:px-10 py-3.5 border-b border-white/10 bg-black/40 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide text-amber-400 truncate">
            {book.nameZh} {chapter}:{fullRangeLabel}
          </h2>
          <span className="text-neutral-500 hidden sm:inline">·</span>
          <span className="text-base sm:text-xl text-neutral-300 font-latin-serif hidden sm:inline truncate">
            {book.nameEn.trim()} {chapter}:{fullRangeLabel}
            {activeVersions.includes('id_tl') ? ` / ${book.nameId} ${chapter}:${fullRangeLabel}` : ''}
          </span>
          {slides.length > 1 && (
            <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tabular-nums whitespace-nowrap">
              自动分页 {safePageIndex + 1}/{slides.length} · 第{pageRangeLabel}节
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 语言显示快捷选项：只中文 / 中英 / 中印 / 三语 */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {LANGUAGE_PRESETS.map((preset) => {
              const isMatch =
                preset.versions.length === activeVersions.length &&
                preset.versions.every((v) => activeVersions.includes(v));
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSetActiveVersions(preset.versions)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isMatch
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* 字号微调 */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
            <button
              type="button"
              onClick={() => setProjectorFontSize((s) => Math.max(22, s - 4))}
              aria-label="减小投影字号"
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs text-neutral-300 px-1 tabular-nums">
              {projectorFontSize}px
            </span>
            <button
              type="button"
              onClick={() => setProjectorFontSize((s) => Math.min(64, s + 4))}
              aria-label="增大投影字号"
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* 对比度底色切换：纯黑底白字 vs 深色底浅色字 */}
          <button
            type="button"
            onClick={() =>
              setProjectorTheme((t) => (t === 'pure_black' ? 'deep_slate' : 'pure_black'))
            }
            title="切换纯黑底白字 / 深色护眼底浅色字"
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-200 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Contrast className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">
              {projectorTheme === 'pure_black' ? '纯黑底' : '深色底'}
            </span>
          </button>

          {/* 多版本时切换上下/左右排版 */}
          {activeVersions.length > 1 && (
            <button
              type="button"
              onClick={onToggleCompareLayout}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-200 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {compareLayout === 'parallel' ? (
                <>
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">左右并排</span>
                </>
              ) : (
                <>
                  <Rows className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">上下对照</span>
                </>
              )}
            </button>
          )}

          {/* 退出投影按钮 */}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Minimize2 className="w-4 h-4" />
            <span>退出投影</span>
          </button>
        </div>
      </header>

      {/* 中央超大字体经文展示区（实时检测高度并自动分割，支持点击左侧1/3上一页、右侧2/3下一页） */}
      <div
        ref={stageRef}
        onClick={(e) => {
          const selection = window.getSelection();
          if (selection && selection.toString().length > 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX < rect.width * 0.35) {
            handleStep('prev');
          } else {
            handleStep('next');
          }
        }}
        title="点击屏幕右侧或按翻页笔下键翻页，点击左侧返回上一页"
        className="relative flex-1 min-h-0 overflow-hidden px-6 sm:px-14 md:px-20 py-6 flex items-center justify-center cursor-pointer"
      >
        <div ref={contentRef} className="w-full max-w-7xl mx-auto">
          {compareLayout === 'parallel' && activeVersions.length > 1 ? (
            /* 左右并排投影排版：等宽均衡分栏，充足列间距与字距 */
            <div
              className={`grid gap-8 lg:gap-12 items-start ${
                activeVersions.length === 2
                  ? 'grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-1 lg:grid-cols-3'
              }`}
            >
              {activeVersions.map((verId) => {
                const verMeta = BIBLE_VERSIONS.find((v) => v.id === verId)!;
                const isZh = verMeta.lang === 'zh';
                const typoStyle = getLanguageTypographyStyle(verMeta.lang);

                return (
                  <div
                    key={verId}
                    className="flex flex-col gap-3.5 border-t border-white/15 pt-4 min-w-0"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm uppercase tracking-widest text-neutral-400">
                      <span>{verMeta.nativeName}</span>
                      {currentSlide.totalParts && currentSlide.totalParts > 1 && (
                        <span className="text-amber-400/80 tabular-nums">
                          分段 {currentSlide.partIndex}/{currentSlide.totalParts}
                        </span>
                      )}
                    </div>
                    <div
                      style={typoStyle}
                      className={`${
                        isZh ? 'font-zh-serif' : 'font-latin-serif'
                      } font-medium space-y-4 break-words`}
                    >
                      {currentPageVerses.map((vNum) => {
                        const displayTxt =
                          currentSlide.textsByVersion[verId]?.[vNum] ??
                          getVerseText(verId, bookIndex, chapter, vNum);
                        return (
                          <p key={vNum}>
                            <sup className="text-amber-400 font-sans text-lg sm:text-xl mr-2.5 tabular-nums font-semibold">
                              {vNum}
                            </sup>
                            {displayTxt}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 单版本或上下对照投影排版：三语层次分明，光学字号与字距均衡 */
            <div className="space-y-7 max-w-5xl mx-auto">
              {currentPageVerses.map((vNum) => (
                <div key={vNum} className="space-y-5">
                  {activeVersions.map((verId) => {
                    const verMeta = BIBLE_VERSIONS.find((v) => v.id === verId)!;
                    const isZh = verMeta.lang === 'zh';
                    const typoStyle = getLanguageTypographyStyle(verMeta.lang);
                    const displayTxt =
                      currentSlide.textsByVersion[verId]?.[vNum] ??
                      getVerseText(verId, bookIndex, chapter, vNum);

                    return (
                      <div key={verId} className="space-y-1.5">
                        {activeVersions.length > 1 && (
                          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400">
                            <span>
                              {verMeta.nativeName} · {chapter}:{vNum}
                            </span>
                            {currentSlide.totalParts && currentSlide.totalParts > 1 && (
                              <span className="text-amber-400/80 tabular-nums">
                                ({currentSlide.partIndex}/{currentSlide.totalParts})
                              </span>
                            )}
                          </div>
                        )}
                        <p
                          style={typoStyle}
                          className={`${
                            isZh ? 'font-zh-serif' : 'font-latin-serif'
                          } font-medium break-words`}
                        >
                          <sup className="text-amber-400 font-sans text-xl sm:text-2xl mr-3 tabular-nums font-semibold">
                            {vNum}
                          </sup>
                          {displayTxt}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 屏幕右下角极淡的“当前经文出处”水印（不干扰会众，方便后排随时确认章节） */}
        <div className="pointer-events-none absolute bottom-4 right-8 text-sm sm:text-base text-white/30 font-zh-serif tracking-wider select-none">
          {book.nameZh} {chapter}:{pageRangeLabel} · {book.nameEn.trim()} {chapter}:{pageRangeLabel}
        </div>
      </div>

      {/* 底部翻节控制栏 */}
      <footer className="shrink-0 flex items-center justify-between px-6 sm:px-10 py-3.5 border-t border-white/10 bg-black/40">
        <button
          type="button"
          onClick={() => handleStep('prev')}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white flex items-center gap-2 text-sm sm:text-base font-medium transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>上一页/节 (← / PageUp)</span>
        </button>

        <div className="text-xs sm:text-sm text-neutral-400 text-center tabular-nums">
          <span>
            第 {pageRangeLabel} / {totalVersesInChapter} 节
            {slides.length > 1 ? `（第 ${safePageIndex + 1}/${slides.length} 页）` : ''}
          </span>
          <span className="hidden md:inline ml-3 text-neutral-500">
            支持：方向键 ← →、空格键、翻页笔 PageUp/PageDown、点击屏幕左右侧
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleStep('next')}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold flex items-center gap-2 text-sm sm:text-base transition-colors cursor-pointer"
        >
          <span>下一页/节 (→ / 空格 / PageDown)</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
};
