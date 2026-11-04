/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 会众扫码同步跟读与讲员手机遥控二维码弹窗 (SyncQrModal.tsx)
 * - 无需账号系统，基于房间号 (Room ID) 与 URL 参数生成离线二维码
 * - 支持两类二维码：
 *   1. 会众同步跟读：会众扫码后手机自动定位到当前经文，并随投影仪翻页实时同步
 *   2. 讲员手机遥控：牧师扫码后手机出现大按钮遥控面板，点“下一节”或点“讲道清单”即可无线控制投影电脑
 */

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, Users, Copy, Check, X, Radio } from 'lucide-react';

interface SyncQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentRefLabel: string;
  bookIndex: number;
  chapter: number;
  selectedVerses: number[];
  onSwitchToRemoteControllerMode: () => void;
}

export const SyncQrModal: React.FC<SyncQrModalProps> = ({
  isOpen,
  onClose,
  roomId,
  currentRefLabel,
  bookIndex,
  chapter,
  selectedVerses,
  onSwitchToRemoteControllerMode,
}) => {
  const [activeTab, setActiveTab] = useState<'congregation' | 'remote'>('congregation');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const verseParam = selectedVerses.length > 0 ? selectedVerses.join(',') : '1';

  const targetUrl =
    activeTab === 'congregation'
      ? `${baseUrl}?room=${encodeURIComponent(roomId)}&mode=follow&b=${bookIndex}&c=${chapter}&v=${verseParam}`
      : `${baseUrl}?room=${encodeURIComponent(roomId)}&mode=remote&b=${bookIndex}&c=${chapter}&v=${verseParam}`;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    QRCode.toDataURL(targetUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: '#1C1917',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="会众扫码同步与讲员手机遥控"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#FBF9F5] dark:bg-[#1C1B1A] text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-800 dark:text-amber-500" />
            <h2 className="text-base font-semibold">主日扫码同步 · 讲员遥控</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭扫码弹窗"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 模式切换按钮 */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800">
            <button
              type="button"
              onClick={() => setActiveTab('congregation')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'congregation'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>会众扫码跟读</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('remote')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'remote'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>讲员手机遥控</span>
            </button>
          </div>
        </div>

        {/* 二维码展示区 */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            当前同步经文：<strong className="text-stone-900 dark:text-stone-100">{currentRefLabel}</strong> · 房间号 <span className="font-mono">{roomId}</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={activeTab === 'congregation' ? '会众跟读二维码' : '讲员手机遥控二维码'}
                referrerPolicy="no-referrer"
                className="w-52 h-52 object-contain"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-stone-400">
                生成二维码中…
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xs leading-relaxed">
            {activeTab === 'congregation'
              ? '会众用手机微信或相机扫码，即可在手机上打开当前正在宣读的经文，并随大屏翻节自动同步。'
              : '牧师用手机扫码后进入“大按钮遥控面板”，在讲台上点“上一节 / 下一节”即可同步控制投影电脑翻页。'}
          </p>

          {/* 复制同步链接与本机预览遥控面板 */}
          <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>已复制同步链接</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>复制同步链接</span>
                </>
              )}
            </button>

            {activeTab === 'remote' && (
              <button
                type="button"
                onClick={() => {
                  onSwitchToRemoteControllerMode();
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>打开遥控器面板</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
