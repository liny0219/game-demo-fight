import { System } from '../ecs/System';
import { TransformComponent } from '../components/TransformComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { ProjectileComponent } from '../components/ProjectileComponent';

export class MovementSystem extends System {
    /** 游戏区域边界设置 */
    private readonly BOUNDS = {
        minX: 20,      // 左边界
        maxX: 780,     // 右边界（800-20）
        minY: 20,      // 上边界
        maxY: 580      // 下边界（600-20）
    };

    update(deltaTime: number): void {
        const entities = this.getEntitiesWith(TransformComponent, VelocityComponent);

        for (const entity of entities) {
            const transform = entity.getComponent(TransformComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;
            const sprite = entity.getComponent(SpriteComponent);
            const projectile = entity.getComponent(ProjectileComponent);

            // 应用摩擦力
            velocity.applyFriction(deltaTime);

            // 更新位置
            const deltaSeconds = deltaTime / 1000;
            const newX = transform.x + velocity.vx * deltaSeconds;
            const newY = transform.y + velocity.vy * deltaSeconds;

            // 投射物不受边界限制，让ProjectileSystem处理销毁
            if (projectile) {
                // 投射物直接更新位置，不做边界限制
                transform.x = newX;
                transform.y = newY;
            } else {
                // 非投射物实体进行边界检测和位置限制
                transform.x = Math.max(this.BOUNDS.minX, Math.min(this.BOUNDS.maxX, newX));
                transform.y = Math.max(this.BOUNDS.minY, Math.min(this.BOUNDS.maxY, newY));

                // 如果撞到边界，停止在该方向的移动
                if (newX < this.BOUNDS.minX || newX > this.BOUNDS.maxX) {
                    velocity.vx = 0;
                }
                if (newY < this.BOUNDS.minY || newY > this.BOUNDS.maxY) {
                    velocity.vy = 0;
                }
            }

            // 更新精灵位置
            if (sprite) {
                sprite.sprite.setPosition(transform.x, transform.y);
                sprite.sprite.setVelocity(velocity.vx, velocity.vy);
            }
        }
    }
} 