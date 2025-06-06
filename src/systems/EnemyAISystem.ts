import 'phaser';
import { System } from '../ecs/System';
import { EnemyComponent } from '../components/EnemyComponent';
import { TransformComponent } from '../components/TransformComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { PlayerComponent } from '../components/PlayerComponent';

export class EnemyAISystem extends System {
    update(deltaTime: number): void {
        const enemyEntities = this.getEntitiesWith(EnemyComponent, TransformComponent, VelocityComponent);
        const playerEntities = this.getEntitiesWith(PlayerComponent, TransformComponent);

        if (playerEntities.length === 0) return;

        const playerTransform = playerEntities[0].getComponent(TransformComponent)!;

        for (const entity of enemyEntities) {
            const enemy = entity.getComponent(EnemyComponent)!;
            const transform = entity.getComponent(TransformComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;

            // 如果正在击退中，不要移动
            if (enemy.isKnockbackActive) {
                continue;
            }

            // 计算朝向玩家的方向
            const angle = Phaser.Math.Angle.Between(
                transform.x, transform.y,
                playerTransform.x, playerTransform.y
            );

            // 设置速度朝向玩家
            velocity.setVelocity(
                Math.cos(angle) * enemy.movementSpeed,
                Math.sin(angle) * enemy.movementSpeed
            );

            // 敌人现在通过碰撞系统自动造成伤害，无需手动攻击逻辑
        }
    }
} 
 