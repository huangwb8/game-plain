import { Entity } from './Entity';

/**
 * 游戏主类
 * 管理游戏循环、实体、输入等
 */
export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private entities: Entity[] = [];
  private lastTime: number = 0;
  private running: boolean = false;
  private animationId: number = 0;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId);
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
  }

  /**
   * 添加实体到游戏
   */
  addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  /**
   * 移除实体
   */
  removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }

  /**
   * 获取所有实体
   */
  getEntities(): Entity[] {
    return this.entities;
  }

  /**
   * 获取 Canvas 尺寸
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * 启动游戏
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * 停止游戏
   */
  stop(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * 游戏主循环
   */
  private gameLoop = (timestamp: number): void => {
    if (!this.running) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * 更新所有实体
   */
  private update(deltaTime: number): void {
    // 更新实体并移除不活跃的
    this.entities = this.entities.filter((entity) => {
      if (entity.active) {
        entity.update(deltaTime);
      }
      return entity.active;
    });
  }

  /**
   * 渲染所有实体
   */
  private render(): void {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染所有实体
    for (const entity of this.entities) {
      if (entity.active) {
        entity.render(this.ctx);
      }
    }
  }
}
