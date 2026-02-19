/**
 * 游戏实体基类
 * 所有游戏对象（玩家、敌人、道具等）都继承此类
 */
export abstract class Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;

  constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.active = true;
  }

  /**
   * 更新实体状态
   * @param deltaTime 距上一帧的时间（毫秒）
   */
  abstract update(deltaTime: number): void;

  /**
   * 渲染实体
   * @param ctx Canvas 2D 上下文
   */
  abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * 检测与另一个实体的碰撞
   */
  collidesWith(other: Entity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }

  /**
   * 销毁实体
   */
  destroy(): void {
    this.active = false;
  }
}
