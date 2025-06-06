import { System } from '../ecs/System';
import { HealthComponent } from '../components/HealthComponent';
import { PlayerComponent } from '../components/PlayerComponent';

export class ComponentUpdateSystem extends System {
    update(deltaTime: number): void {
        // 更新所有健康组件
        const healthEntities = this.getEntitiesWith(HealthComponent);
        for (const entity of healthEntities) {
            const health = entity.getComponent(HealthComponent)!;
            health.update?.(deltaTime);
        }

        // 更新所有玩家组件
        const playerEntities = this.getEntitiesWith(PlayerComponent);
        for (const entity of playerEntities) {
            const player = entity.getComponent(PlayerComponent)!;
            player.update?.(deltaTime);
        }
    }
} 