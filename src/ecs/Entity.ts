/**
 * 实体类 - ECS架构的核心组件
 * 
 * 实体(Entity)是游戏中的基本对象容器，它本身不包含数据或行为，
 * 而是作为组件(Component)的载体。每个实体都有唯一的ID，
 * 可以动态地添加、移除和查询组件。
 * 
 * 设计原则：
 * - 实体只是ID + 组件集合的容器
 * - 不包含任何业务逻辑
 * - 通过组合不同组件来定义实体的属性和能力
 * 
 * @example
 * // 创建一个玩家实体
 * const player = new Entity();
 * player.addComponent(new TransformComponent(100, 100));
 * player.addComponent(new HealthComponent(100));
 * player.addComponent(new PlayerComponent());
 */
import 'phaser';
import { Component } from './Component';

export class Entity {
    /** 实体的唯一标识符 */
    private static nextId: number = 1;
    
    /** 当前实体的ID */
    public readonly id: number;
    
    /** 存储所有组件的映射表，使用组件构造函数名作为键 */
    private components: Map<string, Component> = new Map();
    private scene: Phaser.Scene;

    /**
     * 构造函数 - 创建新的实体实例
     * 自动分配唯一ID并初始化组件容器
     */
    constructor(scene: Phaser.Scene) {
        this.id = Entity.nextId++;
        this.scene = scene;
    }

    /**
     * 添加组件到实体
     * 
     * 将组件实例添加到实体的组件映射表中。
     * 如果同类型的组件已存在，将会被新组件替换。
     * 
     * @param component 要添加的组件实例
     * @example
     * entity.addComponent(new TransformComponent(50, 50));
     * entity.addComponent(new VelocityComponent(100, 0));
     */
    addComponent<T extends Component>(component: T): T {
        this.components.set(component.constructor.name, component);
        component.entity = this;
        return component;
    }

    /**
     * 移除指定类型的组件
     * 
     * 从实体中移除指定类型的组件。如果组件不存在，
     * 操作将被忽略且不会抛出错误。
     * 
     * @param ComponentClass 要移除的组件类型（构造函数）
     * @example
     * entity.removeComponent(VelocityComponent);
     */
    removeComponent<T extends Component>(componentClass: new (...args: any[]) => T): void {
        const name = componentClass.name;
        const component = this.components.get(name);
        if (component) {
            component.destroy?.();
            this.components.delete(name);
        }
    }

    /**
     * 获取指定类型的组件
     * 
     * 根据组件类型返回对应的组件实例。
     * 如果该类型的组件不存在，返回undefined。
     * 
     * @param ComponentClass 要获取的组件类型（构造函数）
     * @returns 组件实例或undefined
     * @example
     * const transform = entity.getComponent(TransformComponent);
     * if (transform) {
     *     console.log(`位置: ${transform.x}, ${transform.y}`);
     * }
     */
    getComponent<T extends Component>(componentClass: new (...args: any[]) => T): T | undefined {
        return this.components.get(componentClass.name) as T;
    }

    /**
     * 检查实体是否拥有指定类型的组件
     * 
     * 用于快速判断实体是否具有某种能力或属性。
     * 常用于系统中筛选具有特定组件组合的实体。
     * 
     * @param ComponentClass 要检查的组件类型（构造函数）
     * @returns 如果拥有该组件返回true，否则返回false
     * @example
     * if (entity.hasComponent(HealthComponent)) {
     *     // 这个实体可以受到伤害
     * }
     */
    hasComponent(componentClass: any): boolean {
        return this.components.has(componentClass.name);
    }

    /**
     * 检查实体是否拥有所有指定类型的组件
     * 
     * 批量检查多个组件，只有当实体拥有所有指定组件时才返回true。
     * 这个方法常用于系统中筛选符合条件的实体。
     * 
     * @param ComponentClasses 要检查的组件类型数组
     * @returns 如果拥有所有组件返回true，否则返回false
     * @example
     * // 检查实体是否可以移动（需要位置和速度组件）
     * if (entity.hasComponents([TransformComponent, VelocityComponent])) {
     *     // 可以进行移动处理
     * }
     */
    hasComponents(ComponentClasses: (new (...args: any[]) => Component)[]): boolean {
        return ComponentClasses.every(ComponentClass => this.hasComponent(ComponentClass));
    }

    /**
     * 获取所有组件
     * 
     * 返回实体中所有组件的数组。
     * 
     * @returns 组件数组
     * @example
     * const components = entity.getAllComponents();
     * components.forEach(component => {
     *     console.log(component);
     * });
     */
    getAllComponents(): Component[] {
        return Array.from(this.components.values());
    }

    getScene(): Phaser.Scene {
        return this.scene;
    }

    /**
     * 销毁实体
     * 
     * 清除实体的所有组件并释放资源。
     * 销毁后的实体不应该再被使用。
     */
    destroy(): void {
        this.components.forEach(component => {
            component.destroy?.();
        });
        this.components.clear();
    }
} 