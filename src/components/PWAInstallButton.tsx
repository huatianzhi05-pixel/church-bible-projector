/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PWA 桌面/手机安装按钮与离线状态提示组件 (PWAInstallButton.tsx)
 * 遵循 pwa-integration 规范：支持 Chromium 原生安装弹窗、iOS Safari 引导与离线缓存状态指示
 */

import React, { useEffect, useState } from 'react';
import { Download, WifiOff, CheckCircle2, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowGuide(true);
          }
        }}
        title="将圣经阅读器安装到电脑或手机桌面，主日断网也能秒开"
        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-stone-700 dark:text-stone-200 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5 text-amber-800 dark:text-amber-500 shrink-0" />
        <span className="hidden lg:inline">安装离线版</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="安装离线应用指南"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#FBF9F5] dark:bg-[#1C1B1A] border border-stone-200 dark:border-stone-800 p-6 shadow-xl text-stone-900 dark:text-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-700 dark:text-amber-500" />
                <span>安装到电脑 / 手机桌面（离线可用）</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              <p>
                本阅读器已启用 <strong>PWA Service Worker 离线缓存</strong>，首次打开后三语经文已自动缓存在本机：
              </p>
              {isIOS ? (
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                  <div className="font-medium text-stone-900 dark:text-stone-100">
                    iPhone / iPad (Safari) 安装步骤：
                  </div>
                  <div>1. 点击浏览器底部工具栏的 <strong>分享</strong> 按钮</div>
                  <div>2. 向下滑动并选择 <strong>添加到主屏幕</strong></div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                  <div className="font-medium text-stone-900 dark:text-stone-100">
                    电脑 Chrome / Edge 或安卓手机安装步骤：
                  </div>
                  <div>1. 点击浏览器地址栏右侧的 <strong>安装图标 (⊕)</strong> 或右上角菜单</div>
                  <div>2. 选择 <strong>安装“微读圣经”</strong> 或 <strong>添加到主屏幕</strong></div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs sm:text-sm font-medium cursor-pointer"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-stone-900 text-amber-300 border border-amber-500/40 px-3.5 py-2 text-xs font-medium shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>当前无网络 · 已自动启用本地离线经文库，主日投影不受影响</span>
    </div>
  );
};
