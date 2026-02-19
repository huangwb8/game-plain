// Buff 掉落系统
const BUFF_TYPES = {
  rapid_fire: { color: '#ff0', label: '速射', duration: 5 },
  speed_up:   { color: '#0ff', label: '加速', duration: 5 },
  shield:     { color: '#a0f', label: '护盾', duration: 3 },
};

export const BUFF_DURATIONS = Object.fromEntries(
  Object.entries(BUFF_TYPES).map(([k, v]) => [k, v.duration])
);

export class Buff {
  constructor() {
    this.x = 0; this.y = 0;
    this.w = 22; this.h = 22;
    this.type = 'rapid_fire';
    this.active = false;
    this.speed = 80;
    this._anim = 0;
  }

  init(x, y, type) {
    this.x = x - this.w / 2;
    this.y = y;
    this.type = type;
    this.active = true;
    this._anim = 0;
  }

  update(dt, canvasH) {
    this.y += this.speed * dt;
    this._anim += dt;
    if (this.y > canvasH) this.active = false;
  }

  render(ctx) {
    const cfg = BUFF_TYPES[this.type];
    const pulse = 0.75 + 0.25 * Math.sin(this._anim * 6);
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = cfg.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    // 菱形
    ctx.beginPath();
    ctx.moveTo(cx, this.y);
    ctx.lineTo(this.x + this.w, cy);
    ctx.lineTo(cx, this.y + this.h);
    ctx.lineTo(this.x, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 首字
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.label[0], cx, cy);
    ctx.restore();
  }
}

export class BuffManager {
  constructor() {
    this.buffs = Array.from({ length: 10 }, () => new Buff());
    this.DROP_CHANCE = 0.3;
  }

  tryDrop(x, y) {
    if (Math.random() > this.DROP_CHANCE) return;
    const b = this.buffs.find(b => !b.active);
    if (!b) return;
    const types = Object.keys(BUFF_TYPES);
    b.init(x, y, types[Math.floor(Math.random() * types.length)]);
  }

  update(dt, canvasH) {
    for (const b of this.buffs) {
      if (b.active) b.update(dt, canvasH);
    }
  }

  render(ctx) {
    for (const b of this.buffs) {
      if (b.active) b.render(ctx);
    }
  }

  // 返回与玩家碰撞的 buff 类型（并标记为非活跃）
  checkCollision(player) {
    for (const b of this.buffs) {
      if (!b.active) continue;
      if (_rectsOverlap(b, player)) {
        b.active = false;
        return b.type;
      }
    }
    return null;
  }
}

function _rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
