import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// 注册 PWA Service Worker，首次加载后缓存全站与本地三语经文数据
registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(<App />);
