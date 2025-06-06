import { System } from '../ecs/System';
import { HealthBarComponent } from '../components/HealthBarComponent';
import { HealthComponent } from '../components/HealthComponent';
import { TransformComponent } from '../components/TransformComponent';

export class HealthBarSystem extends System {
    update(deltaTime: number): void {
        const entities = this.getEntitiesWith(HealthBarComponent, HealthComponent, TransformComponent);

        for (const entity of entities) {
            const healthBar = entity.getComponent(HealthBarComponent)!;
            const health = entity.getComponent(HealthComponent)!;
            const transform = entity.getComponent(TransformComponent)!;

            // 如果血条还没创建，创建它
            if (!healthBar.bar) {
                healthBar.createHealthBar(transform.x, transform.y);
            }

            // 更新血条
            healthBar.updateHealthBar(
                transform.x,
                transform.y,
                health.currentHealth,
                health.maxHealth
            );
        }
    }
} 