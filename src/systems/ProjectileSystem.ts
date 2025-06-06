import 'phaser';
import { System } from '../ecs/System';
import { ProjectileComponent } from '../components/ProjectileComponent';
import { TransformComponent } from '../components/TransformComponent';
import { SpriteComponent } from '../components/SpriteComponent';

export class ProjectileSystem extends System {
    /** 投射物边界设置 - 与游戏区域边界保持一致 */
    private readonly PROJECTILE_BOUNDS = {
        minX: 0,       // 左边界（稍微宽松一点）
        maxX: 800,     // 右边界
        minY: 0,       // 上边界
        maxY: 600      // 下边界
    };

    update(deltaTime: number): void {
        const projectileEntities = this.getEntitiesWith(ProjectileComponent, TransformComponent, SpriteComponent);

        for (const entity of projectileEntities) {
            const projectileComponent = entity.getComponent(ProjectileComponent)!;
            const transform = entity.getComponent(TransformComponent)!;

            // 更新投射物生命周期
            projectileComponent.update(deltaTime);

            // 检查是否超出屏幕边界或超时
            const isOutOfBounds = transform.x < this.PROJECTILE_BOUNDS.minX || 
                                transform.x > this.PROJECTILE_BOUNDS.maxX || 
                                transform.y < this.PROJECTILE_BOUNDS.minY || 
                                transform.y > this.PROJECTILE_BOUNDS.maxY;
            
            if (projectileComponent.isExpired() || isOutOfBounds) {
                // 投射物过期或超出边界，销毁它
                this.world.removeEntity(entity);
            }
        }
    }
} 