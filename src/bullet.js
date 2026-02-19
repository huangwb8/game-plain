export class Bullet {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.w = 4;
    this.h = 12;
    this.speed = 600; // px/s
    this.damage = 1;
    this.active = false;
  }

  init(x, y) {
    this.x = x - this.w / 2;
    this.y = y;
    this.active = true;
  }

  update(dt) {
    this.y -= this.speed * dt;
    if (this.y + this.h < 0) this.active = false;
  }

  render(ctx) {
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 6;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;
  }
}

export class BulletPool {
  constructor(size) {
    this.pool = Array.from({ length: size }, () => new Bullet());
    // 为了减少每帧分配，直接遍历 pool，用 bullet.active 做筛选
    this.active = this.pool;
  }

  spawn(x, y) {
    const b = this.pool.find((b) => !b.active);
    if (!b) return; // 池满则跳过
    b.init(x, y);
  }

  update(dt) {
    for (const b of this.pool) {
      if (b.active) b.update(dt);
    }
  }

  render(ctx) {
    for (const b of this.pool) {
      if (b.active) b.render(ctx);
    }
  }
}
