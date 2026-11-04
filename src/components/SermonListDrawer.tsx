/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 主日讲道经文清单组件 (SermonListDrawer.tsx)
 * - 支持提前输入本周讲道经文（如 "约3:16-21、罗8:28-30、诗23"）
 * - 支持鼠标拖拽排序 (Drag & Drop) 与上下移动按钮
 * - 主日礼拜时一键跳转或直接进入全屏投影
 */

import React, { useState } from 'react';
import {
  ListOrdered,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MonitorPlay,
  X,
  Download,
} from 'lucide-react';
import {
  SermonScriptureItem,
  parseSermonInputList,
} from '../utils/bibleReference';

interface SermonListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: SermonScriptureItem[];
  onUpdateItems: (next: SermonScriptureItem[]) => void;
  onSelectItem: (item: SermonScriptureItem, openProjector: boolean) => void;
  onAddCurrentSelection: () => void;
  currentSelectionLabel: string;
  onExportOfflineBackup: () => void;
}

export const SermonListDrawer: React.FC<SermonListDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateItems,
  onSelectItem,
  onAddCurrentSelection,
  currentSelectionLabel,
  onExportOfflineBackup,
}) => {
  const [batchInput, setBatchInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchInput.trim()) return;

    const parsedItems = parseSermonInputList(batchInput);
    if (parsedItems.length === 0) {
      setInputError('未能识别输入的经文格式，请尝试如：约3:16-21、罗8:28-30、诗23');
      return;
    }

    setInputError(null);
    onUpdateItems([...items, ...parsedItems]);
    setBatchInput('');
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    onUpdateItems(copy);
  };

  const handleRemoveItem = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, overIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === overIdx) return;
    const copy = [...items];
    const [draggedItem] = copy.splice(draggedIdx, 1);
    copy.splice(overIdx, 0, draggedItem);
    setDraggedIdx(overIdx);
    onUpdateItems(copy);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="主日讲道经文清单"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-[#FBF9F5] dark:bg-[#1C1B1A] text-stone-900 dark:text-stone-100 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-amber-800 dark:text-amber-500" />
            <div>
              <h2 className="text-base sm:text-lg font-semibold">主日讲道经文清单</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                周六备课提前录入，主日点一下即跳转或全屏投影（支持拖拽排序）
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="关闭讲道清单"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 批量添加输入框 + 加入当前选中经文 */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/50 space-y-3">
          <form onSubmit={handleAddBatch} className="flex gap-2">
            <input
              type="text"
              value={batchInput}
              onChange={(e) => {
                setBatchInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="批量输入如：约3:16-21、罗8:28-30、诗23"
              aria-label="输入主日讲道经文"
              className="flex-1 px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-700 dark:focus:border-amber-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs sm:text-sm font-medium flex items-center gap-1 hover:opacity-90 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>添加</span>
            </button>
          </form>

          {inputError && (
            <p className="text-xs text-red-700 dark:text-red-400">{inputError}</p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onAddCurrentSelection}
              className="text-xs text-amber-900 dark:text-amber-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>将当前阅读位置加入清单 ({currentSelectionLabel})</span>
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => onUpdateItems([])}
                className="text-xs text-stone-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
              >
                清空清单
              </button>
            )}
          </div>
        </div>

        {/* 经文清单列表（支持拖拽与一键投影） */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {items.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-stone-500 text-sm space-y-2">
              <p>当前讲道经文清单为空</p>
              <p className="text-xs">
                您可以在上方输入如“约3:16-21、罗8:28-30、诗23”一键生成本周主日经文列表
              </p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={() => setDraggedIdx(null)}
                className={`group flex items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-stone-900 border transition-colors ${
                  draggedIdx === idx
                    ? 'border-amber-600 opacity-60'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="text-stone-400 cursor-grab active:cursor-grabbing p-1"
                    title="拖拽调整顺序"
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono text-stone-400 dark:text-stone-500 w-5 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectItem(item, false);
                      onClose();
                    }}
                    className="text-left font-medium text-sm sm:text-base text-stone-900 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-400 truncate flex-1 cursor-pointer"
                  >
                    {item.label}
                  </button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectItem(item, true);
                      onClose();
                    }}
                    title="直接全屏投影此段经文"
                    className="px-2.5 py-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 hover:opacity-90 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <MonitorPlay className="w-3.5 h-3.5" />
                    <span>投影</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveItem(idx, 'up')}
                    disabled={idx === 0}
                    aria-label={`上移 ${item.label}`}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(idx, 'down')}
                    disabled={idx === items.length - 1}
                    aria-label={`下移 ${item.label}`}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label={`删除 ${item.label}`}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部一键备份 U 盘离线包 */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            备课完成后可导出单文件离线备份包存入U盘
          </div>
          <button
            type="button"
            onClick={onExportOfflineBackup}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:border-stone-500 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-amber-800 dark:text-amber-500" />
            <span>一键备份到U盘</span>
          </button>
        </div>
      </div>
    </div>
  );
};
