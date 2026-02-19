import { Player } from './player.js';
import { EnemyManager } from './enemy.js';
import { BulletPool } from './bullet.js';
import { UI } from './ui.js';

const CANVAS_W = 480;
const CANVAS_H = 640;

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

    this.state = 'playing'; // 'playing' | 'gameover'
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.frameCount = 0;

    this.bulletPool = new BulletPool(50);
    // 传入 top-left 坐标，确保视觉居中
    this.player = new Player(CANVAS_W / 2 - 20, CANVAS_H - 80, this.bulletPool);
    this.enemyManager = new EnemyManager(CANVAS_W, CANVAS_H);
    this.ui = new UI(this.ctx, CANVAS_W, CANVAS_H);

    this.lastTime = 0;
    this._bindInput();
  }

  _bindInput() {
    this.keys = {};

    const preventKeys = new Set(['ArrowLeft', 'ArrowRight', 'Space']);

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (preventKeys.has(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (preventKeys.has(e.code)) e.preventDefault();
    });
    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  update(dt) {
    if (this.state !== 'playing') return;

    this.frameCount++;
    this.player.update(dt, this.keys, CANVAS_W);
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
            this.score += enemy.score;
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
          if (this.lives <= 0) this.state = 'gameover';
          break; // 一次碰撞只扣 1 条命
        }
      }
    }

    // 关卡升级：每 500 分升一级
    this.level = Math.floor(this.score / 500) + 1;
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (this.state === 'playing') {
      this.player.render(ctx);
      this.enemyManager.render(ctx);
      this.bulletPool.render(ctx);
      this.ui.render(this.score, this.lives, this.level);
    } else {
      // 结束画面也展示最后一帧（更自然）
      this.player.render(ctx);
      this.enemyManager.render(ctx);
      this.bulletPool.render(ctx);
      this.ui.render(this.score, this.lives, this.level);
      this.ui.renderGameOver(this.score);
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
