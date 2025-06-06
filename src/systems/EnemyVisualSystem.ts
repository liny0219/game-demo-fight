/**
 * 敌人视觉系统 - 处理敌人的视觉特效和动画
 * 
 * 敌人视觉系统负责管理敌人的各种视觉效果，包括：
 * - 缩放弹跳动画（移动时的弹性效果）
 * - 精灵缩放同步
 * - 移动状态检测
 * - 视觉特效的更新和维护
 * 
 * 主要功能：
 * - 实时更新敌人的缩放弹跳动画
 * - 根据移动速度判断敌人移动状态
 * - 同步动画状态到精灵显示
 * - 提供平缓自然的视觉反馈
 * 
 * 设计原则：
 * - 与游戏逻辑分离，专注于视觉表现
 * - 高效的批量处理所有敌人
 * - 平缓自然的动画过渡
 * - 可配置的视觉效果参数
 * 
 * @example
 * // 在主场景中添加敌人视觉系统
 * const enemyVisualSystem = new EnemyVisualSystem(world);
 * world.addSystem(enemyVisualSystem);
 * 
 * // 系统会自动处理所有敌人的视觉效果
 * // 无需手动调用，每帧自动更新
 */
import 'phaser';
import { System } from '../ecs/System';
import { EnemyComponent } from '../components/EnemyComponent';
import { TransformComponent } from '../components/TransformComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { SpriteComponent } from '../components/SpriteComponent';

export class EnemyVisualSystem extends System {
    /** 移动检测阈值 - 速度低于此值视为静止状态 */
    private readonly MOVEMENT_THRESHOLD = 5;

    /**
     * 系统更新 - 每帧处理所有敌人的视觉效果
     * 
     * 更新流程：
     * 1. 获取所有具有必要组件的敌人实体
     * 2. 检测每个敌人的移动状态
     * 3. 更新弹跳动画参数
     * 4. 应用缩放效果到精灵
     * 
     * @param deltaTime 帧时间间隔（毫秒）
     */
    update(deltaTime: number): void {
        // 获取所有需要处理视觉效果的敌人实体
        const enemyEntities = this.getEntitiesWith(
            EnemyComponent,
            TransformComponent,
            VelocityComponent,
            SpriteComponent
        );

        // 批量处理所有敌人的视觉效果
        for (const entity of enemyEntities) {
            this.processEnemyVisuals(entity, deltaTime);
        }
    }

    /**
     * 处理单个敌人的视觉效果
     * 
     * 包括移动状态检测、弹跳动画更新和精灵缩放应用。
     * 
     * @param entity 敌人实体
     * @param deltaTime 帧时间间隔（毫秒）
     */
    private processEnemyVisuals(entity: any, deltaTime: number): void {
        const enemyComponent = entity.getComponent(EnemyComponent)!;
        const velocity = entity.getComponent(VelocityComponent)!;
        const sprite = entity.getComponent(SpriteComponent)!;

        // 检测敌人移动状态
        this.updateMovementState(enemyComponent, velocity);

        // 更新弹跳动画
        this.updateBounceAnimation(enemyComponent, deltaTime);

        // 应用缩放效果到精灵
        this.applySpriteScale(enemyComponent, sprite);
    }

    /**
     * 更新敌人移动状态
     * 
     * 根据敌人的速度向量判断是否处于移动状态。
     * 使用阈值避免微小抖动影响动画效果。
     * 
     * @param enemyComponent 敌人组件
     * @param velocity 速度组件
     */
    private updateMovementState(enemyComponent: EnemyComponent, velocity: VelocityComponent): void {
        // 计算总速度（向量长度）
        const totalSpeed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
        
        // 根据速度阈值判断移动状态
        const isMoving = totalSpeed > this.MOVEMENT_THRESHOLD;
        
        // 更新敌人组件的移动状态
        enemyComponent.setMoving(isMoving);
    }

    /**
     * 更新弹跳动画
     * 
     * 调用敌人组件的弹跳动画更新方法，计算当前帧的缩放值。
     * 
     * @param enemyComponent 敌人组件
     * @param deltaTime 帧时间间隔（毫秒）
     */
    private updateBounceAnimation(enemyComponent: EnemyComponent, deltaTime: number): void {
        // 更新敌人组件内部的弹跳动画状态
        enemyComponent.updateBounceAnimation(deltaTime);
    }

    /**
     * 应用精灵缩放效果
     * 
     * 将计算得到的缩放值应用到敌人的精灵对象上。
     * 确保视觉效果与动画状态同步。
     * 
     * @param enemyComponent 敌人组件
     * @param sprite 精灵组件
     */
    private applySpriteScale(enemyComponent: EnemyComponent, sprite: SpriteComponent): void {
        // 获取当前计算的缩放值
        const currentScale = enemyComponent.getCurrentScale();
        
        // 应用缩放到精灵对象（X和Y轴同时缩放保持比例）
        sprite.sprite.setScale(currentScale, currentScale);
    }

    /**
     * 设置全局弹跳参数
     * 
     * 批量设置所有敌人的弹跳效果参数。
     * 用于运行时动态调整视觉效果。
     * 
     * @param intensity 弹跳强度（0.0-1.0）
     * @param frequency 弹跳频率（建议1.0-5.0）
     */
    public setGlobalBounceParameters(intensity: number, frequency: number): void {
        const enemyEntities = this.getEntitiesWith(EnemyComponent);
        
        for (const entity of enemyEntities) {
            const enemyComponent = entity.getComponent(EnemyComponent)!;
            enemyComponent.setBounceParameters(intensity, frequency);
        }
    }

    /**
     * 启用或禁用全局弹跳效果
     * 
     * 批量控制所有敌人的弹跳动画启用状态。
     * 
     * @param enabled true启用弹跳，false禁用弹跳
     */
    public setGlobalBounceEnabled(enabled: boolean): void {
        const enemyEntities = this.getEntitiesWith(EnemyComponent);
        
        for (const entity of enemyEntities) {
            const enemyComponent = entity.getComponent(EnemyComponent)!;
            enemyComponent.setBounceEnabled(enabled);
        }
    }

    /**
     * 获取系统状态信息
     * 
     * 返回当前系统处理的敌人数量和状态统计。
     * 用于调试和性能监控。
     * 
     * @returns 系统状态信息对象
     */
    public getSystemStats(): {
        totalEnemies: number;
        movingEnemies: number;
        bouncingEnemies: number;
    } {
        const enemyEntities = this.getEntitiesWith(EnemyComponent);
        let movingCount = 0;
        let bouncingCount = 0;

        for (const entity of enemyEntities) {
            const enemyComponent = entity.getComponent(EnemyComponent)!;
            
            if (enemyComponent.isMoving) {
                movingCount++;
            }
            
            if (enemyComponent.bounceEnabled) {
                bouncingCount++;
            }
        }

        return {
            totalEnemies: enemyEntities.length,
            movingEnemies: movingCount,
            bouncingEnemies: bouncingCount
        };
    }
} 