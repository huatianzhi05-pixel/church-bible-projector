import React, { useState, useEffect } from 'react';
import { X, BookOpen, ChevronRight } from 'lucide-react';
import { BIBLE_BOOKS, BookMeta } from '../utils/bibleReference';

interface BookChapterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentBookIndex: number;
  currentChapter: number;
  getVerseCount: (bookIndex: number, chapter: number) => number;
  onSelectDestination: (bookIndex: number, chapter: number, verse?: number) => void;
}

type Step = 'book' | 'chapter' | 'verse';

export const BookChapterSelector: React.FC<BookChapterSelectorProps> = ({
  isOpen,
  onClose,
  currentBookIndex,
  currentChapter,
  getVerseCount,
  onSelectDestination,
}) => {
  const [step, setStep] = useState<Step>('book');
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [selectedBookIdx, setSelectedBookIdx] = useState<number>(currentBookIndex);
  const [selectedChapter, setSelectedChapter] = useState<number>(currentChapter);

  useEffect(() => {
    if (isOpen) {
      setSelectedBookIdx(currentBookIndex);
      setSelectedChapter(currentChapter);
      setStep('book');
    }
  }, [isOpen, currentBookIndex, currentChapter]);

  if (!isOpen) return null;

  const selectedBook: BookMeta = BIBLE_BOOKS[selectedBookIdx] || BIBLE_BOOKS[0];
  const chaptersCount = selectedBook.chaptersCount;
  const versesCount = getVerseCount(selectedBookIdx, selectedChapter);

  const filteredBooks = BIBLE_BOOKS.filter((b) =>
    testamentFilter === 'ALL' ? true : b.testament === testamentFilter
  );

  const handleBookClick = (bookIdx: number) => {
    setSelectedBookIdx(bookIdx);
    setSelectedChapter(1);
    setStep('chapter');
  };

  const handleChapterClick = (ch: number) => {
    setSelectedChapter(ch);
    setStep('verse');
  };

  const handleVerseClick = (v: number) => {
    onSelectDestination(selectedBookIdx, selectedChapter, v);
    onClose();
  };

  const handleReadWholeChapter = () => {
    onSelectDestination(selectedBookIdx, selectedChapter, undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="选择书卷章节"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[#FBF9F5] dark:bg-[#1C1B1A] text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部面包屑导航栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 text-sm sm:text-base font-medium">
            <BookOpen className="w-4 h-4 text-amber-800 dark:text-amber-500 shrink-0" />
            <button
              type="button"
              onClick={() => setStep('book')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                step === 'book'
                  ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              1. 书卷 ({selectedBook.nameZh})
            </button>
            <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
            <button
              type="button"
              onClick={() => setStep('chapter')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                step === 'chapter'
                  ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              2. 第 {selectedChapter} 章
            </button>
            <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
            <button
              type="button"
              onClick={() => setStep('verse')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                step === 'verse'
                  ? 'bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              3. 选节
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="关闭目录"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 步骤一：选择书卷 */}
        {step === 'book' && (
          <>
            <div className="flex items-center justify-between px-5 py-3 bg-stone-100/70 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-1 p-1 bg-stone-200/70 dark:bg-stone-800 rounded-lg">
                {(
                  [
                    { id: 'ALL', label: '全部 66 卷' },
                    { id: 'OT', label: '旧约 (39卷)' },
                    { id: 'NT', label: '新约 (27卷)' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTestamentFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      testamentFilter === tab.id
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
                点击书卷进入章节选择
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredBooks.map((book) => {
                const isCurrent = book.index === selectedBookIdx;
                return (
                  <button
                    key={book.index}
                    type="button"
                    onClick={() => handleBookClick(book.index)}
                    className={`group flex flex-col items-start justify-center px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer min-h-[56px] ${
                      isCurrent
                        ? 'bg-amber-900/10 dark:bg-amber-500/15 border-amber-800/40 dark:border-amber-500/40 text-amber-950 dark:text-amber-200'
                        : 'bg-white/80 dark:bg-stone-900/60 border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="w-full flex items-baseline justify-between gap-1">
                      <span className="font-medium text-sm sm:text-base truncate">
                        {book.nameZh}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums shrink-0">
                        {book.chaptersCount}章
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-latin-serif truncate w-full mt-0.5">
                      {book.nameEn.trim()} · {book.nameId}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 步骤二：选择章 */}
        {step === 'chapter' && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {selectedBook.nameZh} · {selectedBook.nameEn.trim()} · {selectedBook.nameId}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  共 {chaptersCount} 章，请选择要前往的章数
                </p>
              </div>
              <button
                type="button"
                onClick={handleReadWholeChapter}
                className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              >
                直接读第 {selectedChapter} 章
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: chaptersCount }, (_, i) => i + 1).map((ch) => {
                const isSelected = ch === selectedChapter && selectedBookIdx === currentBookIndex;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleChapterClick(ch)}
                    className={`min-h-[44px] rounded-xl border text-sm font-medium tabular-nums transition-colors cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-stone-400 dark:hover:border-stone-600'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 步骤三：选择节 */}
        {step === 'verse' && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {selectedBook.nameZh} 第 {selectedChapter} 章
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  选择具体节数将自动滚动并高亮该节经文（方便投影与领读）
                </p>
              </div>
              <button
                type="button"
                onClick={handleReadWholeChapter}
                className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                全章阅读（不限节）
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: versesCount }, (_, i) => i + 1).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleVerseClick(v)}
                  aria-label={`第 ${v} 节`}
                  className="min-h-[44px] rounded-xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-amber-700 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-sm font-medium tabular-nums transition-colors cursor-pointer flex items-center justify-center"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
