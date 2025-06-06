/**
 * 敌人组件 - 存储敌人的所有属性和状态
 * 
 * 敌人组件包含了敌人实体的核心属性，包括：
 * - 基础属性：移动速度、伤害、攻击范围等
 * - 状态管理：击退状态、攻击冷却时间等
 * - 视觉效果：缩放弹跳动画状态
 * 
 * 主要功能：
 * - 管理敌人的基本行为参数
 * - 跟踪敌人的状态（如击退、动画等）
 * - 提供攻击和特效的接口方法
 * 
 * 设计原则：
 * - 数据与逻辑分离，只存储属性不包含行为
 * - 提供清晰的状态查询和修改接口
 * - 支持扩展的视觉效果系统
 * 
 * @example
 * // 创建普通敌人
 * const enemy = new EnemyComponent();
 * 
 * // 创建强化敌人
 * const strongEnemy = new EnemyComponent(150, 40, 60, 800, 150);
 * 
 * // 检查攻击状态
 * if (enemy.canAttack(currentTime)) {
 *     enemy.attack(currentTime);
 * }
 */
import { Component } from '../ecs/Component';

export class EnemyComponent extends Component {
    /** 移动速度 - 敌人每秒移动的像素数 */
    public movementSpeed: number;
    
    /** 攻击伤害 - 敌人对玩家造成的伤害值 */
    public damage: number;
    
    /** 攻击范围 - 敌人能够攻击的距离（像素） */
    public attackRange: number;
    
    /** 最后攻击时间 - 用于计算攻击冷却（毫秒时间戳） */
    public lastAttackTime: number = 0;
    
    /** 攻击冷却时间 - 两次攻击之间的间隔（毫秒） */
    public attackCooldown: number;
    
    /** 血条最大值 - 用于血条UI显示的参考值 */
    public maxHealthPerBar: number;
    
    /** 击退状态 - 标记敌人是否正在被击退中 */
    public isKnockbackActive: boolean = false;

    // === 缩放弹跳动画相关属性 ===
    
    /** 缩放弹跳强度 - 控制弹跳效果的幅度 (0.0-1.0) */
    public bounceIntensity: number = 0.2;
    
    /** 弹跳频率 - 控制弹跳的速度，值越大弹跳越快 */
    public bounceFrequency: number = 2.0;
    
    /** 弹跳动画时间跟踪 - 用于计算当前弹跳相位的累计时间 */
    public bounceTime: number = 0;
    
    /** 基础缩放值 - 敌人的默认缩放大小 */
    public baseScale: number = 1.0;
    
    /** 当前缩放值 - 实时计算的缩放值，包含弹跳效果 */
    public currentScale: number = 1.0;
    
    /** 弹跳动画启用状态 - 控制是否应用弹跳效果 */
    public bounceEnabled: boolean = true;
    
    /** 移动状态 - 标记敌人是否正在移动，用于触发弹跳动画 */
    public isMoving: boolean = false;

    /**
     * 构造函数 - 初始化敌人组件
     * 
     * @param movementSpeed 移动速度，默认100像素/秒
     * @param damage 攻击伤害，默认25点
     * @param attackRange 攻击范围，默认40像素
     * @param attackCooldown 攻击冷却时间，默认1000毫秒（1秒）
     * @param maxHealthPerBar 血条最大值，默认100点
     * @param bounceIntensity 弹跳强度，默认0.2（20%缩放变化，本体的五分之一）
     * @param bounceFrequency 弹跳频率，默认2.0（0.5秒一个弹跳周期）
     * 
     * @example
     * // 创建标准敌人
     * new EnemyComponent();
     * 
     * // 创建快速移动的敌人
     * new EnemyComponent(200);
     * 
     * // 创建高伤害敌人
     * new EnemyComponent(100, 50);
     * 
     * // 创建具有自定义弹跳效果的敌人
     * new EnemyComponent(100, 25, 40, 1000, 100, 0.25, 4.0);
     */
    constructor(
        movementSpeed: number = 100,
        damage: number = 25,
        attackRange: number = 40,
        attackCooldown: number = 1000,
        maxHealthPerBar: number = 100,
        bounceIntensity: number = 0.2,
        bounceFrequency: number = 2.0
    ) {
        super();
        this.movementSpeed = movementSpeed;
        this.damage = damage;
        this.attackRange = attackRange;
        this.attackCooldown = attackCooldown;
        this.maxHealthPerBar = maxHealthPerBar;
        this.bounceIntensity = bounceIntensity;
        this.bounceFrequency = bounceFrequency;
        
        // 给每个敌人随机的弹跳起始时间，避免所有敌人同步弹跳
        this.bounceTime = Math.random() * Math.PI * 2;
    }

    /**
     * 检查敌人是否可以攻击
     * 
     * 根据攻击冷却时间判断敌人是否可以进行下一次攻击。
     * 
     * @param currentTime 当前时间戳（毫秒）
     * @returns true表示可以攻击，false表示仍在冷却中
     * 
     * @example
     * const currentTime = Date.now();
     * if (enemy.canAttack(currentTime)) {
     *     // 执行攻击逻辑
     *     enemy.attack(currentTime);
     * }
     */
    canAttack(currentTime: number): boolean {
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }

    /**
     * 执行攻击
     * 
     * 记录攻击时间，用于计算下次攻击的冷却。
     * 
     * @param currentTime 当前时间戳（毫秒）
     * 
     * @example
     * if (enemy.canAttack(currentTime)) {
     *     enemy.attack(currentTime);
     *     // 处理攻击逻辑...
     * }
     */
    attack(currentTime: number): void {
        this.lastAttackTime = currentTime;
    }

    /**
     * 设置击退状态
     * 
     * 控制敌人的击退状态，被击退的敌人不会主动移动。
     * 
     * @param active true表示开始击退，false表示结束击退
     * 
     * @example
     * // 开始击退
     * enemy.setKnockback(true);
     * 
     * // 500毫秒后结束击退
     * setTimeout(() => {
     *     enemy.setKnockback(false);
     * }, 500);
     */
    setKnockback(active: boolean): void {
        this.isKnockbackActive = active;
    }

    /**
     * 更新缩放弹跳动画
     * 
     * 根据时间和移动状态计算当前的缩放值，实现平缓的弹跳效果。
     * 使用正弦波函数创建自然的弹跳动画。
     * 
     * @param deltaTime 帧时间间隔（毫秒）
     * 
     * @example
     * // 在系统的update方法中调用
     * enemy.updateBounceAnimation(deltaTime);
     * const scale = enemy.getCurrentScale();
     * sprite.setScale(scale);
     */
    updateBounceAnimation(deltaTime: number): void {
        if (!this.bounceEnabled) {
            this.currentScale = this.baseScale;
            return;
        }

        // 更新弹跳时间
        this.bounceTime += (deltaTime / 1000) * this.bounceFrequency;

        // 如果敌人正在移动，应用弹跳效果
        if (this.isMoving && !this.isKnockbackActive) {
            // 使用平滑的余弦波创建缩小到原始大小的弹跳效果
            // 使用 (1 + cos) / 2 获得1到0的平滑过渡，然后乘以强度
            const normalizedCos = (1 + Math.cos(this.bounceTime)) / 2;
            const bounceValue = normalizedCos * this.bounceIntensity;
            
            // 目标缩放值（从原始尺寸缩小，然后恢复）
            const targetScale = this.baseScale - bounceValue;
            
            // 平滑过渡到目标缩放，避免突兀的变化
            this.currentScale = Phaser.Math.Linear(this.currentScale, targetScale, 0.15);
        } else {
            // 不移动时平滑回到基础缩放
            this.currentScale = Phaser.Math.Linear(this.currentScale, this.baseScale, 0.08);
        }
    }

    /**
     * 获取当前缩放值
     * 
     * 返回包含弹跳效果的当前缩放值。
     * 
     * @returns 当前的缩放值（在 baseScale-bounceIntensity 到 baseScale 范围内）
     * 
     * @example
     * const scale = enemy.getCurrentScale();
     * sprite.setScale(scale);
     */
    getCurrentScale(): number {
        return this.currentScale;
    }

    /**
     * 设置移动状态
     * 
     * 更新敌人的移动状态，用于控制弹跳动画的触发。
     * 
     * @param moving true表示正在移动，false表示静止
     * 
     * @example
     * // 在AI系统中根据速度判断移动状态
     * const isMoving = Math.abs(velocity.vx) > 0.1 || Math.abs(velocity.vy) > 0.1;
     * enemy.setMoving(isMoving);
     */
    setMoving(moving: boolean): void {
        this.isMoving = moving;
    }

    /**
     * 设置弹跳参数
     * 
     * 动态调整弹跳效果的强度和频率。
     * 
     * @param intensity 弹跳强度（0.0-1.0）
     * @param frequency 弹跳频率（建议1.0-5.0）
     * 
     * @example
     * // 设置更强烈的弹跳效果
     * enemy.setBounceParameters(0.3, 4.0);
     * 
     * // 设置平缓的弹跳效果
     * enemy.setBounceParameters(0.1, 2.0);
     */
    setBounceParameters(intensity: number, frequency: number): void {
        this.bounceIntensity = Math.max(0, Math.min(1, intensity)); // 限制在0-1范围
        this.bounceFrequency = Math.max(0.1, frequency); // 避免零或负频率
    }

    /**
     * 启用或禁用弹跳效果
     * 
     * @param enabled true启用弹跳，false禁用弹跳
     * 
     * @example
     * // 禁用弹跳效果
     * enemy.setBounceEnabled(false);
     * 
     * // 重新启用弹跳效果
     * enemy.setBounceEnabled(true);
     */
    setBounceEnabled(enabled: boolean): void {
        this.bounceEnabled = enabled;
        if (!enabled) {
            this.currentScale = this.baseScale;
        }
    }
} 