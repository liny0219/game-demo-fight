/**
 * 世界类 - ECS架构的核心管理器
 * 
 * 世界(World)是ECS架构的中心枢纽，负责管理所有的实体(Entity)和系统(System)。
 * 它协调实体和系统之间的交互，并提供查询、更新等核心功能。
 * 
 * 主要职责：
 * - 管理实体的生命周期（创建、销毁、查询）
 * - 管理系统的生命周期（添加、移除、更新）
 * - 提供实体查询接口（基于组件类型）
 * - 协调系统的执行顺序
 * - 处理实体和系统的批量操作
 * 
 * 设计原则：
 * - 作为单一的管理入口点
 * - 提供高效的实体查询机制
 * - 支持延迟操作（避免在迭代中修改集合）
 * - 保持系统间的解耦
 * 
 * @example
 * // 创建世界并设置系统
 * const world = new World(scene);
 * world.addSystem(new MovementSystem(world));
 * world.addSystem(new RenderSystem(world));
 * 
 * // 创建实体
 * const player = world.createEntity();
 * player.addComponent(new TransformComponent(100, 100));
 * player.addComponent(new PlayerComponent());
 * 
 * // 在游戏循环中更新
 * world.update(deltaTime);
 */
import 'phaser';
import { Entity } from './Entity';
import { System } from './System';
import { Component } from './Component';

export class World {
    /** 场景引用，用于与Phaser游戏引擎交互 */
    private scene: Phaser.Scene;
    
    /** 所有活跃实体的集合 */
    private entities: Set<Entity> = new Set();
    
    /** 所有注册系统的数组，按优先级排序 */
    private systems: System[] = [];
    
    /** 待删除的实体队列，用于延迟删除避免迭代冲突 */
    private entitiesToRemove: Set<Entity> = new Set();
    
    /** 待添加的实体队列，用于延迟添加避免迭代冲突 */
    private entitiesToAdd: Set<Entity> = new Set();

    /**
     * 构造函数 - 初始化世界实例
     * 
     * @param scene Phaser场景实例，用于访问游戏引擎功能
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 创建新的实体
     * 
     * 创建一个新的实体并添加到世界中。
     * 实体会被添加到待添加队列，在下次更新时正式加入世界。
     * 
     * @returns 新创建的实体实例
     * @example
     * const enemy = world.createEntity();
     * enemy.addComponent(new TransformComponent(200, 200));
     * enemy.addComponent(new EnemyComponent());
     * enemy.addComponent(new HealthComponent(100));
     */
    createEntity(): Entity {
        const entity = new Entity(this.scene);
        this.entitiesToAdd.add(entity);
        return entity;
    }

    /**
     * 移除实体
     * 
     * 将实体标记为待删除，实际删除操作会在下次更新时执行。
     * 这种延迟删除机制避免了在系统迭代过程中修改实体集合。
     * 
     * @param entity 要移除的实体
     * @example
     * // 敌人死亡时移除
     * if (enemy.getComponent(HealthComponent)!.currentHealth <= 0) {
     *     world.removeEntity(enemy);
     * }
     */
    removeEntity(entity: Entity): void {
        this.entitiesToRemove.add(entity);
    }

    /**
     * 添加系统到世界
     * 
     * 将系统注册到世界中，系统会在每次更新时被调用。
     * 系统按照优先级排序，优先级数值越小越早执行。
     * 
     * @param system 要添加的系统实例
     * @example
     * // 按顺序添加系统，物理系统先于渲染系统
     * world.addSystem(new PhysicsSystem(world));
     * world.addSystem(new RenderSystem(world));
     */
    addSystem(system: System): void {
        this.systems.push(system);
        
        // 按优先级排序系统，确保执行顺序正确
        this.systems.sort((a, b) => a.getPriority() - b.getPriority());
        
        // 如果系统有初始化方法，立即调用
        if (system.init) {
            system.init();
        }
        
        console.log(`系统 ${system.getName()} 已添加到世界`);
    }

    /**
     * 从世界中移除系统
     * 
     * @param systemClass 要移除的系统类型
     * @example
     * world.removeSystem(DebugSystem);
     */
    removeSystem(systemClass: new (...args: any[]) => System): void {
        const index = this.systems.findIndex(system => system instanceof systemClass);
        if (index !== -1) {
            const system = this.systems[index];
            
            // 如果系统有销毁方法，调用它
            if (system.destroy) {
                system.destroy();
            }
            
            this.systems.splice(index, 1);
            console.log(`系统 ${system.getName()} 已从世界中移除`);
        }
    }

    /**
     * 获取指定类型的系统
     * 
     * @param systemClass 系统类型
     * @returns 系统实例或undefined
     * @example
     * const collisionSystem = world.getSystem(CollisionSystem);
     * if (collisionSystem) {
     *     collisionSystem.checkPlayerAttack();
     * }
     */
    getSystem<T extends System>(systemClass: new (...args: any[]) => T): T | undefined {
        return this.systems.find(system => system instanceof systemClass) as T;
    }

    /**
     * 查询具有指定组件的所有实体
     * 
     * 这是ECS架构中最重要的方法之一，用于筛选出符合条件的实体。
     * 只有同时拥有所有指定组件的实体才会被返回。
     * 
     * @param componentClasses 要查询的组件类型数组
     * @returns 符合条件的实体数组
     * @example
     * // 查询所有可移动的实体
     * const movableEntities = world.getEntitiesWith(TransformComponent, VelocityComponent);
     * 
     * // 查询所有敌人
     * const enemies = world.getEntitiesWith(EnemyComponent, TransformComponent, HealthComponent);
     * 
     * // 查询所有投射物
     * const projectiles = world.getEntitiesWith(ProjectileComponent, TransformComponent);
     */
    getEntitiesWith(...componentClasses: (new (...args: any[]) => Component)[]): Entity[] {
        const result: Entity[] = [];
        
        // 遍历所有实体，检查是否拥有所需的组件
        for (const entity of Array.from(this.entities)) {
            // 使用Entity的hasComponents方法进行批量检查
            if (entity.hasComponents(componentClasses)) {
                result.push(entity);
            }
        }
        
        return result;
    }

    /**
     * 获取所有实体
     * 
     * 返回世界中所有活跃实体的数组。
     * 注意：这是实体集合的副本，修改返回的数组不会影响世界。
     * 
     * @returns 所有实体的数组
     * @example
     * const allEntities = world.getAllEntities();
     * console.log(`世界中有 ${allEntities.length} 个实体`);
     */
    getAllEntities(): Entity[] {
        return Array.from(this.entities);
    }

    /**
     * 获取实体数量
     * 
     * @returns 当前活跃实体的数量
     */
    getEntityCount(): number {
        return this.entities.size;
    }

    /**
     * 世界更新 - 核心游戏循环
     * 
     * 这是世界的核心方法，在每个游戏帧中被调用。
     * 执行顺序：
     * 1. 处理待添加的实体
     * 2. 处理待删除的实体
     * 3. 更新所有启用的系统
     * 
     * @param deltaTime 自上次更新以来的时间差（毫秒）
     * @example
     * // 在Phaser场景的update方法中调用
     * update(time: number, delta: number): void {
     *     this.world.update(delta);
     * }
     */
    update(deltaTime: number): void {
        // 第一步：添加待添加的实体
        if (this.entitiesToAdd.size > 0) {
            for (const entity of Array.from(this.entitiesToAdd)) {
                this.entities.add(entity);
            }
            this.entitiesToAdd.clear();
        }

        // 第二步：移除待删除的实体
        if (this.entitiesToRemove.size > 0) {
            for (const entity of Array.from(this.entitiesToRemove)) {
                this.entities.delete(entity);
                // 清理实体资源
                entity.destroy();
            }
            this.entitiesToRemove.clear();
        }

        // 第三步：更新所有启用的系统
        for (const system of this.systems) {
            if (system.enabled) {
                try {
                    system.update(deltaTime);
                } catch (error) {
                    console.error(`系统 ${system.getName()} 更新时发生错误:`, error);
                    // 可以选择禁用出错的系统
                    // system.setEnabled(false);
                }
            }
        }
    }

    /**
     * 暂停世界
     * 
     * 暂停所有系统的更新，但保留实体状态。
     * 系统可以选择性地响应暂停事件。
     */
    pause(): void {
        for (const system of this.systems) {
            if (system.pause) {
                system.pause();
            }
        }
        console.log('世界已暂停');
    }

    /**
     * 恢复世界
     * 
     * 从暂停状态恢复世界的正常运行。
     */
    resume(): void {
        for (const system of this.systems) {
            if (system.resume) {
                system.resume();
            }
        }
        console.log('世界已恢复');
    }

    /**
     * 清空世界
     * 
     * 移除所有实体和系统，重置世界状态。
     * 通常用于场景切换或游戏重启。
     * 
     * @example
     * // 游戏结束时清空世界
     * gameOver(): void {
     *     this.world.clear();
     *     this.scene.scene.start('GameOverScene');
     * }
     */
    clear(): void {
        // 销毁所有实体
        for (const entity of Array.from(this.entities)) {
            entity.destroy();
        }
        this.entities.clear();
        this.entitiesToAdd.clear();
        this.entitiesToRemove.clear();

        // 销毁所有系统
        for (const system of this.systems) {
            if (system.destroy) {
                system.destroy();
            }
        }
        this.systems.length = 0;

        console.log('世界已清空');
    }

    /**
     * 获取世界统计信息
     * 
     * 返回世界的当前状态信息，用于调试和监控。
     * 
     * @returns 包含统计信息的对象
     */
    getStats(): {
        entityCount: number;
        systemCount: number;
        pendingAdditions: number;
        pendingRemovals: number;
    } {
        return {
            entityCount: this.entities.size,
            systemCount: this.systems.length,
            pendingAdditions: this.entitiesToAdd.size,
            pendingRemovals: this.entitiesToRemove.size
        };
    }
} 