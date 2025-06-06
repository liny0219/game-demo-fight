/**
 * 变换组件 - 实体的空间变换信息
 * 
 * 变换组件存储实体在2D空间中的位置、旋转和缩放信息。
 * 这是最基础的组件之一，几乎所有可见的实体都需要这个组件。
 * 
 * 主要用途：
 * - 定义实体在游戏世界中的位置
 * - 存储实体的旋转角度
 * - 控制实体的显示缩放
 * - 为渲染系统和物理系统提供空间信息
 * 
 * 设计原则：
 * - 只存储数据，不包含变换逻辑
 * - 提供便捷的数据访问方法
 * - 支持常见的2D变换操作
 * 
 * @example
 * // 创建一个位于屏幕中心的实体
 * const entity = world.createEntity();
 * entity.addComponent(new TransformComponent(400, 300, 0, 1.0, 1.0));
 * 
 * // 移动实体
 * const transform = entity.getComponent(TransformComponent)!;
 * transform.x += 10;
 * transform.y += 5;
 */
import { Component } from '../ecs/Component';

export class TransformComponent extends Component {
    /** X坐标 - 实体在水平方向的位置 */
    public x: number;
    
    /** Y坐标 - 实体在垂直方向的位置 */
    public y: number;
    
    /** 旋转角度 - 以弧度为单位，0表示不旋转 */
    public rotation: number;
    
    /** X轴缩放因子 - 1.0表示原始大小，0.5表示缩小一半，2.0表示放大一倍 */
    public scaleX: number;
    
    /** Y轴缩放因子 - 1.0表示原始大小，0.5表示缩小一半，2.0表示放大一倍 */
    public scaleY: number;

    /**
     * 构造函数 - 初始化变换组件
     * 
     * @param x X坐标，默认为0
     * @param y Y坐标，默认为0  
     * @param rotation 旋转角度（弧度），默认为0
     * @param scaleX X轴缩放，默认为1.0
     * @param scaleY Y轴缩放，默认为1.0
     * 
     * @example
     * // 创建默认变换（原点，无旋转，原始大小）
     * new TransformComponent();
     * 
     * // 创建指定位置的变换
     * new TransformComponent(100, 200);
     * 
     * // 创建包含旋转的变换
     * new TransformComponent(100, 200, Math.PI / 4); // 旋转45度
     * 
     * // 创建包含缩放的变换
     * new TransformComponent(100, 200, 0, 2.0, 2.0); // 放大2倍
     */
    constructor(
        x: number = 0, 
        y: number = 0, 
        rotation: number = 0, 
        scaleX: number = 1.0, 
        scaleY: number = 1.0
    ) {
        super();
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
    }

    /**
     * 设置位置
     * 
     * 同时设置X和Y坐标的便捷方法。
     * 
     * @param x 新的X坐标
     * @param y 新的Y坐标
     * @example
     * transform.setPosition(100, 200);
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * 获取位置
     * 
     * 返回包含X和Y坐标的对象。
     * 
     * @returns 包含x和y属性的位置对象
     * @example
     * const pos = transform.getPosition();
     * console.log(`实体位置: (${pos.x}, ${pos.y})`);
     */
    getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    /**
     * 平移位置
     * 
     * 在当前位置基础上添加偏移量。
     * 
     * @param deltaX X方向的偏移量
     * @param deltaY Y方向的偏移量
     * @example
     * // 向右移动10个单位，向上移动5个单位
     * transform.translate(10, -5);
     */
    translate(deltaX: number, deltaY: number): void {
        this.x += deltaX;
        this.y += deltaY;
    }

    /**
     * 设置旋转角度
     * 
     * @param rotation 旋转角度（弧度）
     * @example
     * // 旋转90度
     * transform.setRotation(Math.PI / 2);
     */
    setRotation(rotation: number): void {
        this.rotation = rotation;
    }

    /**
     * 旋转指定角度
     * 
     * 在当前旋转基础上增加角度。
     * 
     * @param deltaRotation 要增加的旋转角度（弧度）
     * @example
     * // 顺时针旋转45度
     * transform.rotate(Math.PI / 4);
     */
    rotate(deltaRotation: number): void {
        this.rotation += deltaRotation;
    }

    /**
     * 设置缩放
     * 
     * 同时设置X和Y轴的缩放因子。
     * 
     * @param scaleX X轴缩放因子
     * @param scaleY Y轴缩放因子，如果未提供则使用scaleX的值（等比缩放）
     * @example
     * // 等比放大2倍
     * transform.setScale(2.0);
     * 
     * // X轴放大2倍，Y轴缩小到一半
     * transform.setScale(2.0, 0.5);
     */
    setScale(scaleX: number, scaleY?: number): void {
        this.scaleX = scaleX;
        this.scaleY = scaleY !== undefined ? scaleY : scaleX;
    }

    /**
     * 计算到另一个变换的距离
     * 
     * 使用欧几里得距离公式计算两点间的直线距离。
     * 
     * @param other 另一个变换组件
     * @returns 两点间的距离
     * @example
     * const distance = playerTransform.distanceTo(enemyTransform);
     * if (distance < 50) {
     *     console.log('敌人就在附近！');
     * }
     */
    distanceTo(other: TransformComponent): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算到另一个变换的角度
     * 
     * 计算从当前位置到目标位置的角度（弧度）。
     * 
     * @param other 目标变换组件
     * @returns 角度（弧度），范围为 -π 到 π
     * @example
     * const angle = transform.angleTo(targetTransform);
     * // 设置实体朝向目标
     * transform.setRotation(angle);
     */
    angleTo(other: TransformComponent): number {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }

    /**
     * 检查是否在指定区域内
     * 
     * 检查当前位置是否在矩形区域内。
     * 
     * @param minX 区域的最小X坐标
     * @param minY 区域的最小Y坐标
     * @param maxX 区域的最大X坐标
     * @param maxY 区域的最大Y坐标
     * @returns 如果在区域内返回true
     * @example
     * // 检查是否在屏幕范围内
     * if (transform.isInBounds(0, 0, 800, 600)) {
     *     console.log('实体在屏幕内');
     * }
     */
    isInBounds(minX: number, minY: number, maxX: number, maxY: number): boolean {
        return this.x >= minX && this.x <= maxX && this.y >= minY && this.y <= maxY;
    }

    /**
     * 克隆变换组件
     * 
     * 创建当前变换组件的深拷贝。
     * 
     * @returns 新的变换组件实例
     * @example
     * const originalTransform = entity.getComponent(TransformComponent)!;
     * const clonedTransform = originalTransform.clone();
     */
    clone(): TransformComponent {
        return new TransformComponent(this.x, this.y, this.rotation, this.scaleX, this.scaleY);
    }

    /**
     * 序列化变换数据
     * 
     * 将变换组件转换为可序列化的对象，用于保存和传输。
     * 
     * @returns 包含变换数据的对象
     */
    serialize(): any {
        return {
            type: 'TransformComponent',
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY
        };
    }

    /**
     * 反序列化变换数据
     * 
     * 从序列化数据恢复变换组件的状态。
     * 
     * @param data 序列化的数据对象
     */
    deserialize(data: any): void {
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.rotation = data.rotation || 0;
        this.scaleX = data.scaleX || 1.0;
        this.scaleY = data.scaleY || 1.0;
    }

    /**
     * 转换为字符串表示
     * 
     * 返回变换组件的字符串描述，用于调试和日志。
     * 
     * @returns 变换组件的字符串表示
     */
    toString(): string {
        return `TransformComponent(x: ${this.x.toFixed(2)}, y: ${this.y.toFixed(2)}, ` +
               `rotation: ${this.rotation.toFixed(2)}, scale: ${this.scaleX.toFixed(2)}, ${this.scaleY.toFixed(2)})`;
    }
} 