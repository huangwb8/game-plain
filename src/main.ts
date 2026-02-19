import { Game } from './game/Game';
import { Entity } from './game/Entity';

/**
 * 测试用简单实体 - 一个移动的方块
 */
class TestEntity extends Entity {
  private velocityX: number;
  private velocityY: number;
  private color: string;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number) {
    super(x, y, 50, 50);
    this.velocityX = 100; // 像素/秒
    this.velocityY = 80;
    this.color = '#e94560';
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  update(deltaTime: number): void {
    // 转换 deltaTime 为秒
    const seconds = deltaTime / 1000;

    // 更新位置
    this.x += this.velocityX * seconds;
    this.y += this.velocityY * seconds;

    // 边界碰撞检测
    if (this.x <= 0 || this.x + this.width >= this.canvasWidth) {
      this.velocityX *= -1;
      this.x = Math.max(0, Math.min(this.x, this.canvasWidth - this.width));
    }
    if (this.y <= 0 || this.y + this.height >= this.canvasHeight) {
      this.velocityY *= -1;
      this.y = Math.max(0, Math.min(this.y, this.canvasHeight - this.height));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

/**
 * 初始化游戏
 */
function initGame(): void {
  const game = new Game('game-canvas');
  const { width, height } = game.getSize();

  // 添加测试实体
  const testEntity = new TestEntity(width / 2 - 25, height / 2 - 25, width, height);
  game.addEntity(testEntity);

  // 启动游戏
  game.start();

  console.log('Game started! A bouncing square should appear.');
}

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', initGame);
