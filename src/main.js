import { Player } from './player.js';
import { EnemyManager } from './enemy.js';
import { BulletPool } from './bullet.js';
import { UI } from './ui.js';
import { SoundManager } from './sound.js';
import { SaveManager } from './save.js';
import { BuffManager } from './buff.js';

const CANVAS_W = 480;
const CANVAS_H = 640;
const LEVEL_TARGET = 500;

// 侧边栏 DOM 引用
const elLevel  = document.getElementById('sv-level');
const elScore  = document.getElementById('sv-score');
const elLives  = document.getElementById('sv-lives');
const elBest   = document.getElementById('sv-best');
const elTime   = document.getElementById('sv-time');
const elBuffPanel = document.getElementById('buff-panel');
const elBuffList  = document.getElementById('buff-list');
const elSoundBtn  = document.getElementById('soundToggle');
const elVolSlider = document.getElementById('volSlider');
const elVolVal    = document.getElementById('volVal');

const BUFF_LABELS = { rapid_fire: '⚡速射', speed_up: '💨加速', shield: '🛡护盾' };

class Game {
  constructor() {
    const canvas = document.getElementById('gameCanvas');
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Canvas #gameCanvas not found');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');

    this.canvas = canvas;
    this.ctx = ctx;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width  = CANVAS_W * dpr;
    this.canvas.height = CANVAS_H * dpr;
    this.canvas.style.width  = `${CANVAS_W}px`;
    this.canvas.style.height = `${CANVAS_H}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.sound = new SoundManager();
    this.saveManager = new SaveManager();

    const save = this.saveManager.load();
    this.score      = save?.score      ?? 0;
    this.lives      = save?.lives      ?? 3;
    this.level      = save?.level      ?? 1;
    this.highScore  = save?.highScore  ?? 0;
    this.levelScore = save?.levelScore ?? 0;

    this._toast = null;
    if (save?.score > 0) {
      this._toast = { msg: `已恢复存档：第 ${this.level} 关 / ${this.score} 分`, alpha: 3.0 };
    }

    this.state = 'playing';
    this.frameCount = 0;

    this.bulletPool  = new BulletPool(50);
    this.player      = new Player(CANVAS_W / 2 - 20, CANVAS_H - 80, this.bulletPool);
    this.enemyManager = new EnemyManager(CANVAS_W, CANVAS_H);
    this.buffManager  = new BuffManager();
    this.ui = new UI(this.ctx, CANVAS_W, CANVAS_H);

    this.lastTime = 0;
    this._gameOverSoundPlayed    = false;
    this._levelCompleteSoundPlayed = false;

    this._bindInput();
    this._bindSidebar();
    this._updateSidebar();
  }

  _bindInput() {
    this.keys = {};
    const preventKeys = new Set(['ArrowLeft', 'ArrowRight', 'Space']);

    window.addEventListener('keydown', (e) => {
      // 首次按键解锁音频
      this.sound.unlock();

      this.keys[e.code] = true;
      if (preventKeys.has(e.code)) e.preventDefault();

      if (this.state === 'levelcomplete' && (e.code === 'Enter' || e.code === 'Space')) {
        this._nextLevel();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (preventKeys.has(e.code)) e.preventDefault();
    });
    window.addEventListener('blur', () => { this.keys = {}; });

    // 点击 canvas 也解锁音频
    this.canvas.addEventListener('click', () => this.sound.unlock(), { once: true });
  }

  _bindSidebar() {
    // 声音开关
    elSoundBtn.addEventListener('click', () => {
      this.sound.unlock();
      const on = this.sound.toggle();
      elSoundBtn.textContent = on ? '🔊 已开启' : '🔇 已静音';
      elSoundBtn.classList.toggle('muted', !on);
    });

    // 音量滑块
    elVolSlider.addEventListener('input', () => {
      const v = parseInt(elVolSlider.value) / 100;
      this.sound.setVolume(v);
      elVolVal.textContent = `${elVolSlider.value}%`;
      // 调音量时解锁并播放一个测试音
      this.sound.unlock();
    });
  }

  _updateSidebar() {
    elLevel.textContent = `第 ${this.level} 关`;
    elScore.textContent = this.score;
    elLives.textContent = '♥'.repeat(this.lives) + '♡'.repeat(Math.max(0, 3 - this.lives));
    elBest.textContent  = this.highScore || '-';

    // 存档时间
    const save = this.saveManager.load();
    if (save?.ts) {
      const d = new Date(save.ts);
      elTime.textContent = `存档: ${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    // Buff 面板
    const buffs = this.player.getActiveBuffs();
    if (buffs.length > 0) {
      elBuffPanel.style.display = 'block';
      elBuffList.innerHTML = buffs.map(b =>
        `<div class="buff-item"><span class="buff-name">${BUFF_LABELS[b.type] ?? b.type}</span><span class="buff-timer">${b.remaining}s</span></div>`
      ).join('');
    } else {
      elBuffPanel.style.display = 'none';
    }
  }

  _nextLevel() {
    this.level++;
    this.levelScore = 0;
    this.state = 'playing';
    this._levelCompleteSoundPlayed = false;
    for (const e of this.enemyManager.enemies) e.active = false;
    this.enemyManager._spawnTimer = 0;
  }

  _triggerLevelComplete() {
    this.state = 'levelcomplete';
    if (!this._levelCompleteSoundPlayed) {
      this.sound.levelUp();
      this._levelCompleteSoundPlayed = true;
    }
    this.saveManager.saveProgress({
      score: this.score, lives: this.lives,
      level: this.level, levelScore: this.levelScore,
      highScore: this.highScore,
    });
    this._updateSidebar();
  }

  update(dt) {
    if (this.state !== 'playing') return;

    this.frameCount++;
    this.player.update(dt, this.keys, CANVAS_W, () => this.sound.shoot());
    this.enemyManager.update(dt, this.frameCount, this.level);
    this.buffManager.update(dt, CANVAS_H);
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
            // 尝试掉落 buff
            this.buffManager.tryDrop(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
            if (this.levelScore >= LEVEL_TARGET) {
              this._triggerLevelComplete();
              return;
            }
          }
          break;
        }
      }
    }

    // Buff 拾取
    const pickedBuff = this.buffManager.checkCollision(this.player);
    if (pickedBuff) {
      this.player.applyBuff(pickedBuff);
      this.sound.buffPickup();
    }

    // 敌机 vs 玩家碰撞（护盾 buff 期间免疫）
    if (this.player.invincible <= 0 && !this.player.isShielded) {
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
          break;
        }
      }
    }

    // Toast 倒计时
    if (this._toast) {
      this._toast.alpha -= dt;
      if (this._toast.alpha <= 0) this._toast = null;
    }

    // 每帧更新侧边栏（buff 倒计时需要实时刷新）
    this._updateSidebar();
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.player.render(ctx);
    this.enemyManager.render(ctx);
    this.bulletPool.render(ctx);
    this.buffManager.render(ctx);
    this.ui.render(this.score, this.lives, this.level, this.highScore);

    if (this._toast) this.ui.renderToast(this._toast.msg, this._toast.alpha);

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
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
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
