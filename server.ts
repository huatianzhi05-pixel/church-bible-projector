/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 轻量级主日遥控与会众同步服务 (server.ts)
 * - 无账号系统、无数据库、无追踪，仅在内存中维护房间当前经文位置状态（Room Sync）
 * - 支持讲员手机扫码遥控投影电脑翻节，以及会众扫码同步跟读当前讲道经文
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomState {
  roomId: string;
  bookIndex: number;
  chapter: number;
  selectedVerses: number[];
  activeVersions: string[];
  sermonList?: Array<{ id: string; refText: string; bookIndex: number; chapter: number; verses: number[] }>;
  updatedAt: number;
}

const rooms = new Map<string, RoomState>();
const roomClients = new Map<string, Set<express.Response>>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. 获取指定房间的当前经文状态
  app.get('/api/sync/:roomId', (req, res) => {
    const { roomId } = req.params;
    const state = rooms.get(roomId);
    if (!state) {
      res.json({ exists: false });
      return;
    }
    res.json({ exists: true, state });
  });

  // 2. 订阅指定房间的实时经文同步流 (Server-Sent Events)
  app.get('/api/sync/:roomId/stream', (req, res) => {
    const { roomId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!roomClients.has(roomId)) {
      roomClients.set(roomId, new Set());
    }
    const clients = roomClients.get(roomId)!;
    clients.add(res);

    // 连接建立时立即发送当前房间状态
    const current = rooms.get(roomId);
    if (current) {
      res.write(`data: ${JSON.stringify(current)}\n\n`);
    }

    req.on('close', () => {
      clients.delete(res);
      if (clients.size === 0) {
        roomClients.delete(roomId);
      }
    });
  });

  // 3. 更新房间经文状态并广播给所有连接的设备（投影端 + 讲员手机遥控端 + 会众手机端）
  app.post('/api/sync/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { bookIndex, chapter, selectedVerses, activeVersions, sermonList } = req.body || {};

    const prev = rooms.get(roomId);
    const nextState: RoomState = {
      roomId,
      bookIndex: typeof bookIndex === 'number' ? bookIndex : prev?.bookIndex ?? 42,
      chapter: typeof chapter === 'number' ? chapter : prev?.chapter ?? 3,
      selectedVerses: Array.isArray(selectedVerses) ? selectedVerses : prev?.selectedVerses ?? [16],
      activeVersions: Array.isArray(activeVersions) ? activeVersions : prev?.activeVersions ?? ['cuv', 'kjv'],
      sermonList: Array.isArray(sermonList) ? sermonList : prev?.sermonList,
      updatedAt: Date.now(),
    };

    rooms.set(roomId, nextState);

    const clients = roomClients.get(roomId);
    if (clients) {
      const payload = `data: ${JSON.stringify(nextState)}\n\n`;
      for (const clientRes of clients) {
        clientRes.write(payload);
      }
    }

    res.json({ ok: true, state: nextState });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bible Reader Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
