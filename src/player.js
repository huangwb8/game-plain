import { BUFF_DURATIONS } from './buff.js';

export class Player {
  constructor(x, y, bulletPool) {
    this.x = x;
    this.y = y;
    this.w = 40;
    this.h = 40;
    this._baseSpeed = 300;   // px/s
    this._baseFireRate = 0.15; // 秒/发
    this.bulletPool = bulletPool;
    this._fireCooldown = 0;
    this.invincible = 0; // 秒

    // Buff 状态：Map<type, remainingTime>
    this._buffs = {};
  }

  // 激活 buff（multiplier 由侧边栏时长滑块控制）
  applyBuff(type, multiplier = 1) {
    this._buffs[type] = (BUFF_DURATIONS[type] ?? 5) * multiplier;
  }

  // 当前是否有某 buff
  hasBuff(type) {
    return (this._buffs[type] ?? 0) > 0;
  }

  // 实际射速（rapid_fire 减半）
  get fireRate() {
    return this.hasBuff('rapid_fire') ? this._baseFireRate * 0.4 : this._baseFireRate;
  }

  // 实际移动速度（speed_up 提升 60%）
  get speed() {
    return this.hasBuff('speed_up') ? this._baseSpeed * 1.6 : this._baseSpeed;
  }

  // 护盾状态（shield buff 期间无敌）
  get isShielded() {
    return this.hasBuff('shield');
  }

  update(dt, keys, canvasW, canvasH, onShoot) {
    // 更新 buff 计时
    for (const type of Object.keys(this._buffs)) {
      this._buffs[type] -= dt;
      if (this._buffs[type] <= 0) delete this._buffs[type];
    }

    // 移动
    if (keys['ArrowLeft']  || keys['KeyA']) this.x -= this.speed * dt;
    if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed * dt;
    if (keys['ArrowUp']    || keys['KeyW']) this.y -= this.speed * dt;
    if (keys['ArrowDown']  || keys['KeyS']) this.y += this.speed * dt;

    // 边界限制
    this.x = Math.max(0, Math.min(canvasW - this.w, this.x));
    this.y = Math.max(0, Math.min(canvasH - this.h, this.y));

    // 射击
    this._fireCooldown -= dt;
    if ((keys['Space'] || keys['KeyZ']) && this._fireCooldown <= 0) {
      this.bulletPool.spawn(this.x + this.w / 2, this.y);
      // rapid_fire 时同时发射两侧子弹
      if (this.hasBuff('rapid_fire')) {
        this.bulletPool.spawn(this.x + 8, this.y + 8);
        this.bulletPool.spawn(this.x + this.w - 8, this.y + 8);
      }
      this._fireCooldown = this.fireRate;
      if (onShoot) onShoot();
    }

    if (this.invincible > 0) this.invincible -= dt;
  }

  onHit() {
    if (this.isShielded) return; // 护盾抵挡伤害
    this.invincible = Math.max(this.invincible, 1.0);
  }

  render(ctx) {
    // 无敌时闪烁（护盾 buff 时不闪烁，改为紫色光晕）
    if (this.invincible > 0 && !this.isShielded && Math.floor(this.invincible * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

    // 护盾光晕
    if (this.isShielded) {
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(160,0,255,0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // speed_up 光晕
    if (this.hasBuff('speed_up')) {
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 机身颜色（rapid_fire 时变金色）
    ctx.fillStyle = this.hasBuff('rapid_fire') ? '#ffd700' : '#4af';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-18, 18);
    ctx.lineTo(0, 10);
    ctx.lineTo(18, 18);
    ctx.closePath();
    ctx.fill();

    // 引擎光
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.ellipse(0, 16, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 返回当前激活的 buff 列表（用于 UI 显示）
  getActiveBuffs() {
    return Object.entries(this._buffs)
      .filter(([, t]) => t > 0)
      .map(([type, remaining]) => ({ type, remaining: Math.ceil(remaining) }));
  }
}
