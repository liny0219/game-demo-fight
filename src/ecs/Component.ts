/**
 * 组件基类 - ECS架构中的数据容器
 * 
 * 组件(Component)是ECS架构中的数据载体，它只包含数据而不包含行为逻辑。
 * 所有具体的组件都应该继承自这个基类。
 * 
 * 设计原则：
 * - 组件只存储数据，不包含业务逻辑
 * - 组件应该是可序列化的
 * - 组件之间应该保持独立，避免相互依赖
 * - 通过组合不同组件来定义实体的能力
 * 
 * @example
 * // 创建一个位置组件
 * class PositionComponent extends Component {
 *     constructor(public x: number, public y: number) {
 *         super();
 *     }
 * }
 * 
 * // 创建一个血量组件
 * class HealthComponent extends Component {
 *     constructor(public health: number, public maxHealth: number) {
 *         super();
 *     }
 * }
 */
export abstract class Component {
    /**
     * 构造函数 - 初始化组件基类
     * 
     * 所有继承的组件都应该调用super()来初始化基类。
     * 基类可以用于添加通用的组件功能，如更新时间戳、标识符等。
     */
    constructor() {
        // 基类暂时没有通用属性，但为未来扩展预留
        // 可以在这里添加如创建时间、更新时间等通用属性
    }

    public entity?: import('./Entity').Entity;

    /**
     * 更新方法 - 可选的组件更新逻辑
     * 
     * 某些组件可能需要在每帧进行更新，比如冷却时间倒计时、
     * 生命周期管理等。继承的组件可以重写此方法来实现更新逻辑。
     * 
     * 注意：这里的更新应该只涉及数据状态的改变，
     * 不应该包含复杂的业务逻辑或与其他组件的交互。
     * 
     * @param deltaTime 自上次更新以来的时间差（毫秒）
     * @example
     * // 在子组件中重写update方法
     * update(deltaTime: number): void {
     *     this.cooldownTime = Math.max(0, this.cooldownTime - deltaTime);
     * }
     */
    update?(deltaTime: number): void {
        // 默认什么都不做，子类可以重写
    }
    
    destroy?(): void {
        // 默认什么都不做，子类可以重写
    }

    /**
     * 克隆方法 - 创建组件的深拷贝
     * 
     * 某些情况下可能需要复制组件，比如创建模板实体、
     * 保存状态快照等。子组件可以重写此方法来实现深拷贝。
     * 
     * @returns 组件的深拷贝实例
     * @example
     * // 在子组件中实现克隆
     * clone(): PositionComponent {
     *     return new PositionComponent(this.x, this.y);
     * }
     */
    clone?(): Component;

    /**
     * 序列化方法 - 将组件数据转换为可序列化的对象
     * 
     * 用于保存游戏状态、网络传输等场景。
     * 子组件可以重写此方法来定义序列化格式。
     * 
     * @returns 可序列化的数据对象
     * @example
     * // 在子组件中实现序列化
     * serialize(): any {
     *     return { x: this.x, y: this.y, type: 'Position' };
     * }
     */
    serialize?(): any;

    /**
     * 反序列化方法 - 从序列化数据恢复组件状态
     * 
     * 与serialize配对使用，用于从保存的数据中恢复组件状态。
     * 
     * @param data 序列化的数据对象
     * @example
     * // 在子组件中实现反序列化
     * deserialize(data: any): void {
     *     this.x = data.x;
     *     this.y = data.y;
     * }
     */
    deserialize?(data: any): void;
} 