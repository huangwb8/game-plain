const SAVE_KEY = 'game-plain-save';

export class SaveManager {
  // 保存游戏进度（通关时）
  saveProgress(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
    } catch (_) { /* 忽略存储错误 */ }
  }

  // 加载存档
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  // 清除游戏进度（游戏结束后只保留最高分）
  clearProgress(highScore) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ highScore, ts: Date.now() }));
    } catch (_) { /* 忽略存储错误 */ }
  }
}
