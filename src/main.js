import { Player } from './player.js';
import { EnemyManager } from './enemy.js';
import { BulletPool } from './bullet.js';
import { UI } from './ui.js';
import { SoundManager } from './sound.js';
import { SaveManager } from './save.js';

const CANVAS_W = 480;
const CANVAS_H = 640;
const LEVEL_TARGET = 500; // 每关需要积累的分数

class Game {
  constructor() {
    const canvas = document.getElementById('gameCanvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas #gameCanvas not found');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');

    this.canvas = canvas;
    this.ctx = ctx;

    // DPR 适配：使用 CSS 像素做逻辑坐标，内部按 DPR 放大
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width = CANVAS_W * dpr;
    this.canvas.height = CANVAS_H * dpr;
    this.canvas.style.width = `${CANVAS_W}px`;
    this.canvas.style.height = `${CANVAS_H}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.sound = new SoundManager();
    this.saveManager = new SaveManager();

    // 从存档恢复（或初始化）
    const save = this.saveManager.load();
    this.score = save?.score ?? 0;
    this.lives = save?.lives ?? 3;
    this.level = save?.level ?? 1;
    this.highScore = save?.highScore ?? 0;
    this.levelScore = save?.levelScore ?? 0; // 当前关内积分

    // 存档恢复提示
    this._toast = null; // { msg, alpha }
    if (save?.score > 0) {
      this._toast = { msg: `已恢复存档：第 ${this.level} 关 / ${this.score} 分`, alpha: 3.0 };
    }

    // state: 'playing' | 'levelcomplete' | 'gameover'
    this.state = 'playing';
    this.frameCount = 0;

    this.bulletPool = new BulletPool(50);
    this.player = new Player(CANVAS_W / 2 - 20, CANVAS_H - 80, this.bulletPool);
    this.enemyManager = new EnemyManager(CANVAS_W, CANVAS_H);
    this.ui = new UI(this.ctx, CANVAS_W, CANVAS_H);

    this.lastTime = 0;
    this._gameOverSoundPlayed = false;
    this._levelCompleteSoundPlayed = false;
    this._bindInput();
  }

  _bindInput() {
    this.keys = {};

    const preventKeys = new Set(['ArrowLeft', 'ArrowRight', 'Space']);

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (preventKeys.has(e.code)) e.preventDefault();

      // 通关界面：Enter 或 Space 进入下一关
      if (this.state === 'levelcomplete' && (e.code === 'Enter' || e.code === 'Space')) {
        this._nextLevel();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (preventKeys.has(e.code)) e.preventDefault();
    });
    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  _nextLevel() {
    this.level++;
    this.levelScore = 0;
    this.state = 'playing';
    this._levelCompleteSoundPlayed = false;
    // 清空场上敌机，给玩家喘息空间
    for (const e of this.enemyManager.enemies) e.active = false;
    this.enemyManager._spawnTimer = 0;
  }

  _triggerLevelComplete() {
    this.state = 'levelcomplete';
    if (!this._levelCompleteSoundPlayed) {
      this.sound.levelUp();
      this._levelCompleteSoundPlayed = true;
    }
    // 保存进度
    this.saveManager.saveProgress({
      score: this.score,
      lives: this.lives,
      level: this.level,
      levelScore: this.levelScore,
      highScore: this.highScore,
    });
  }

  update(dt) {
    if (this.state !== 'playing') return;

    this.frameCount++;
    this.player.update(dt, this.keys, CANVAS_W, () => this.sound.shoot());
    this.enemyManager.update(dt, this.frameCount, this.level);
    this.bulletPool.update(dt);

    // 子弹 vs 敌机碰撞
    for (const bullet of this.bulletPool.active) {
      if (!bullet.active) continue;
      for (const enemy of this.enemyManager.enemies) {
        if (!enemy.active) continue;
        if (rectsOverlap(bullet, enemy)) {
          bullet.active = false;
          enemy.hp -= bullet.damage;
          if (enemy.hp <= 0) {
            enemy.active = false;
            const gained = enemy.score;
            this.score += gained;
            this.levelScore += gained;
            if (this.score > this.highScore) this.highScore = this.score;
            this.sound.explosion();
            // 检查通关
            if (this.levelScore >= LEVEL_TARGET) {
              this._triggerLevelComplete();
              return;
            }
          }
          break; // 一发子弹只命中一次
        }
      }
    }

    // 敌机 vs 玩家碰撞（带无敌帧）
    if (this.player.invincible <= 0) {
      for (const enemy of this.enemyManager.enemies) {
        if (!enemy.active) continue;
        if (rectsOverlap(enemy, this.player)) {
          enemy.active = false;
          this.lives--;
          this.player.onHit();
          this.sound.playerHit();
          if (this.lives <= 0) {
            this.state = 'gameover';
            this.saveManager.clearProgress(this.highScore);
          }
          break; // 一次碰撞只扣 1 条命
        }
      }
    }

    // Toast 倒计时
    if (this._toast) {
      this._toast.alpha -= dt;
      if (this._toast.alpha <= 0) this._toast = null;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 始终渲染游戏画面（通关/结束时也保留最后一帧）
    this.player.render(ctx);
    this.enemyManager.render(ctx);
    this.bulletPool.render(ctx);
    this.ui.render(this.score, this.lives, this.level, this.highScore);

    if (this._toast) {
      this.ui.renderToast(this._toast.msg, this._toast.alpha);
    }

    if (this.state === 'levelcomplete') {
      this.ui.renderLevelComplete(this.level);
    } else if (this.state === 'gameover') {
      if (!this._gameOverSoundPlayed) {
        this.sound.gameOver();
        this._gameOverSoundPlayed = true;
      }
      this.ui.renderGameOver(this.score, this.highScore);
    }
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // 最大 50ms 防跳帧
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  start() {
    requestAnimationFrame((ts) => {
      this.lastTime = ts;
      this.loop(ts);
    });
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const game = new Game();
game.start();
