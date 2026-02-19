const ENEMY_TYPES = {
  normal: {
    w: 36,
    h: 36,
    speed: 120,
    hp: 1,
    score: 10,
    color: '#f44',
  },
  elite: {
    w: 48,
    h: 48,
    speed: 80,
    hp: 3,
    score: 50,
    color: '#f80',
  },
};

export class Enemy {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.w = 36;
    this.h = 36;
    this.speed = 120;
    this.hp = 1;
    this.maxHp = 1;
    this.score = 10;
    this.color = '#f44';
    this.type = 'normal';
    this.active = false;
  }

  init(x, y, type = 'normal') {
    const cfg = ENEMY_TYPES[type];
    this.x = x;
    this.y = y;
    this.w = cfg.w;
    this.h = cfg.h;
    this.speed = cfg.speed;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.score = cfg.score;
    this.color = cfg.color;
    this.type = type;
    this.active = true;
  }

  update(dt, canvasH) {
    this.y += this.speed * dt;
    if (this.y > canvasH) this.active = false;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    ctx.rotate(Math.PI); // 朝下

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 2 + 4);
    ctx.lineTo(-this.w / 2 + 4, this.h / 2 - 4);
    ctx.lineTo(0, this.h / 2 - 10);
    ctx.lineTo(this.w / 2 - 4, this.h / 2 - 4);
    ctx.closePath();
    ctx.fill();

    // 精英敌机显示 HP 条
    if (this.type === 'elite') {
      ctx.fillStyle = '#333';
      ctx.fillRect(-this.w / 2, -this.h / 2 - 8, this.w, 4);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(-this.w / 2, -this.h / 2 - 8, this.w * (this.hp / this.maxHp), 4);
    }

    ctx.restore();
  }
}

export class EnemyManager {
  constructor(canvasW, canvasH) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.enemies = Array.from({ length: 30 }, () => new Enemy());
    this._spawnTimer = 0;
  }

  _spawnInterval(level) {
    // 随关卡加快生成速度，最快 0.5s
    return Math.max(0.5, 1.5 - level * 0.1);
  }

  _eliteChance(level) {
    // 随关卡提升精英概率，最高 40%
    return Math.min(0.4, 0.05 + level * 0.03);
  }

  update(dt, frameCount, level) {
    void frameCount;
    this._spawnTimer += dt;
    if (this._spawnTimer >= this._spawnInterval(level)) {
      this._spawnTimer = 0;
      this._spawn(level);
    }
    for (const e of this.enemies) {
      if (e.active) e.update(dt, this.canvasH);
    }
  }

  _spawn(level) {
    const e = this.enemies.find((e) => !e.active);
    if (!e) return;
    const type = Math.random() < this._eliteChance(level) ? 'elite' : 'normal';
    const cfg = ENEMY_TYPES[type];
    const x = Math.random() * (this.canvasW - cfg.w);
    e.init(x, -cfg.h, type);
  }

  render(ctx) {
    for (const e of this.enemies) {
      if (e.active) e.render(ctx);
    }
  }
}

