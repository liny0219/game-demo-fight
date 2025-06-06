/**
 * 系统基类 - ECS架构中的逻辑处理器
 * 
 * 系统(System)是ECS架构中负责处理业务逻辑的部分。
 * 系统不存储数据，而是操作具有特定组件组合的实体。
 * 
 * 设计原则：
 * - 系统只包含逻辑，不存储状态数据
 * - 系统通过查询组件来筛选需要处理的实体
 * - 系统之间应该保持松耦合
 * - 每个系统应该专注于单一职责
 * 
 * @example
 * // 创建一个移动系统
 * class MovementSystem extends System {
 *     update(deltaTime: number): void {
 *         const entities = this.getEntitiesWith(TransformComponent, VelocityComponent);
 *         for (const entity of entities) {
 *             const transform = entity.getComponent(TransformComponent)!;
 *             const velocity = entity.getComponent(VelocityComponent)!;
 *             transform.x += velocity.vx * deltaTime;
 *             transform.y += velocity.vy * deltaTime;
 *         }
 *     }
 * }
 */
import { Entity } from './Entity';
import { World } from './World';
import { Component } from './Component';

export abstract class System {
    /** 对世界(World)实例的引用，用于访问实体和其他系统 */
    protected world: World;
    public enabled: boolean = true;

    /**
     * 构造函数 - 初始化系统
     * 
     * @param world 世界实例，包含所有实体和系统的管理器
     */
    constructor(world: World) {
        this.world = world;
        console.log(`[System] 创建系统: ${this.constructor.name}`);
    }

    /**
     * 更新方法 - 系统的核心逻辑处理
     * 
     * 这是系统的主要方法，在每个游戏循环中被调用。
     * 子类必须实现此方法来定义系统的具体行为。
     * 
     * 典型的实现流程：
     * 1. 查询需要处理的实体（基于组件类型）
     * 2. 遍历这些实体
     * 3. 获取相关组件
     * 4. 执行业务逻辑
     * 5. 更新组件数据
     * 
     * @param deltaTime 自上次更新以来的时间差（毫秒）
     * @example
     * update(deltaTime: number): void {
     *     const entities = this.getEntitiesWith(HealthComponent);
     *     for (const entity of entities) {
     *         const health = entity.getComponent(HealthComponent)!;
     *         if (health.regeneration > 0) {
     *             health.currentHealth += health.regeneration * deltaTime;
     *         }
     *     }
     * }
     */
    abstract update(deltaTime: number): void;

    /**
     * 查询具有指定组件类型的所有实体
     * 
     * 这是系统最常用的方法，用于筛选出需要处理的实体。
     * 只有同时拥有所有指定组件的实体才会被返回。
     * 
     * @param componentTypes 要查询的组件类型数组
     * @returns 符合条件的实体数组
     * @example
     * // 查询所有可移动的实体（需要位置和速度组件）
     * const movableEntities = this.getEntitiesWith(TransformComponent, VelocityComponent);
     * 
     * // 查询所有敌人（需要敌人组件、位置组件和血量组件）
     * const enemies = this.getEntitiesWith(EnemyComponent, TransformComponent, HealthComponent);
     */
    protected getEntitiesWith(...componentTypes: (new (...args: any[]) => Component)[]): Entity[] {
        return this.world.getEntitiesWith(...componentTypes);
    }

    /**
     * 获取单个实体（如果存在）
     * 
     * 当你知道只有一个实体符合条件时使用，比如玩家实体。
     * 如果有多个符合条件的实体，只返回第一个。
     * 
     * @param componentTypes 要查询的组件类型数组
     * @returns 符合条件的第一个实体，如果没有则返回undefined
     * @example
     * // 获取玩家实体
     * const player = this.getEntityWith(PlayerComponent, TransformComponent);
     * if (player) {
     *     const transform = player.getComponent(TransformComponent)!;
     *     console.log(`玩家位置: ${transform.x}, ${transform.y}`);
     * }
     */
    protected getEntityWith(...componentTypes: (new (...args: any[]) => Component)[]): Entity | undefined {
        const entities = this.getEntitiesWith(...componentTypes);
        return entities.length > 0 ? entities[0] : undefined;
    }

    /**
     * 系统初始化方法
     * 
     * 在系统被添加到世界时调用，用于执行一次性的初始化操作。
     * 子类可以重写此方法来执行特定的初始化逻辑。
     * 
     * @example
     * init(): void {
     *     console.log('渲染系统初始化完成');
     *     this.setupRenderingContext();
     * }
     */
    init?(): void;

    /**
     * 系统销毁方法
     * 
     * 在系统被从世界中移除时调用，用于清理资源和事件监听器。
     * 子类应该重写此方法来执行清理操作。
     * 
     * @example
     * destroy(): void {
     *     this.removeEventListeners();
     *     this.cleanupResources();
     *     console.log('系统已销毁');
     * }
     */
    destroy(): void {
        console.log(`[System] 销毁系统: ${this.constructor.name}`);
        // 子类可以重写此方法以进行清理
    }

    /**
     * 系统暂停方法
     * 
     * 当游戏暂停时调用，系统可以选择性地暂停某些操作。
     * 子类可以重写此方法来定义暂停行为。
     */
    pause?(): void;

    /**
     * 系统恢复方法
     * 
     * 当游戏从暂停状态恢复时调用。
     * 子类可以重写此方法来定义恢复行为。
     */
    resume?(): void;

    /**
     * 获取系统名称
     * 
     * 返回系统的类名，用于调试和日志记录。
     * 
     * @returns 系统的类名
     */
    getName(): string {
        return this.constructor.name;
    }

    /**
     * 获取系统优先级
     * 
     * 系统的执行顺序可能很重要，比如物理系统应该在渲染系统之前执行。
     * 子类可以重写此方法来定义执行优先级（数值越小优先级越高）。
     * 
     * @returns 系统优先级（默认为0）
     */
    getPriority(): number {
        return 0;
    }

    setEnabled(enabled: boolean): void {
        console.log(`[System] ${this.constructor.name} 设置启用状态: ${enabled}`);
        this.enabled = enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }
} 