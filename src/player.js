export class Player {
  constructor(x, y, bulletPool) {
    this.x = x;
    this.y = y;
    this.w = 40;
    this.h = 40;
    this.speed = 300; // px/s
    this.bulletPool = bulletPool;
    this.fireRate = 0.15; // 秒/发
    this._fireCooldown = 0;
    this.invincible = 0; // 秒
  }

  update(dt, keys, canvasW) {
    // 移动
    if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed * dt;
    if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed * dt;

    // 边界限制
    this.x = Math.max(0, Math.min(canvasW - this.w, this.x));

    // 射击
    this._fireCooldown -= dt;
    if ((keys['Space'] || keys['KeyZ']) && this._fireCooldown <= 0) {
      this.bulletPool.spawn(this.x + this.w / 2, this.y);
      this._fireCooldown = this.fireRate;
    }

    if (this.invincible > 0) this.invincible -= dt;
  }

  onHit() {
    // 无敌帧避免连续碰撞扣血
    this.invincible = Math.max(this.invincible, 1.0);
  }

  render(ctx) {
    // 无敌时闪烁
    if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

    // 机身
    ctx.fillStyle = '#4af';
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
}

