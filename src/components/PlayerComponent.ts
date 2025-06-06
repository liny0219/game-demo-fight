/**
 * 玩家组件 - 玩家特有的属性和状态
 * 
 * 玩家组件存储与玩家角色相关的特有数据，如移动速度、技能冷却、
 * 攻击状态等。这个组件只会被添加到玩家实体上，用于区分玩家和其他实体。
 * 
 * 主要功能：
 * - 存储玩家的移动和攻击参数
 * - 管理技能冷却时间
 * - 记录玩家的朝向和状态
 * - 提供技能使用的接口
 * 
 * 设计原则：
 * - 只存储玩家相关的数据
 * - 提供技能冷却管理
 * - 支持状态查询和更新
 * 
 * @example
 * // 创建玩家实体
 * const player = world.createEntity();
 * player.addComponent(new PlayerComponent(200, 3000, 300, 400));
 * 
 * // 使用技能
 * const playerComp = player.getComponent(PlayerComponent)!;
 * if (playerComp.canUseSkill()) {
 *     playerComp.useSkill();
 *     // 执行技能逻辑...
 * }
 */
import { Component } from '../ecs/Component';

export class PlayerComponent extends Component {
    /** 移动速度 - 玩家每秒移动的像素数 */
    public movementSpeed: number;
    
    /** 当前技能冷却时间 - 剩余的冷却时间（毫秒） */
    public skillCooldown: number = 0;
    
    /** 技能冷却总时间 - 技能使用后需要等待的总时间（毫秒） */
    public skillCooldownTime: number;
    
    /** 最后移动方向 - 记录玩家最后的移动方向，用于攻击和技能释放 */
    public lastMoveDirection: { x: number; y: number };
    
    /** 是否正在攻击 - 标记玩家当前是否处于攻击状态 */
    public isAttacking: boolean = false;
    
    /** 攻击持续时间 - 攻击动作持续的时间（毫秒） */
    public attackDuration: number;
    
    /** 投射物速度 - 玩家技能发射的投射物移动速度 */
    public projectileSpeed: number;

    /**
     * 构造函数 - 初始化玩家组件
     * 
     * @param movementSpeed 移动速度，默认200像素/秒
     * @param skillCooldownTime 技能冷却时间，默认5000毫秒（5秒）
     * @param attackDuration 攻击持续时间，默认200毫秒
     * @param projectileSpeed 投射物速度，默认400像素/秒
     * 
     * @example
     * // 创建具有默认属性的玩家组件
     * new PlayerComponent();
     * 
     * // 创建移动速度更快的玩家
     * new PlayerComponent(300);
     * 
     * // 创建技能冷却更短的玩家
     * new PlayerComponent(200, 3000);
     * 
     * // 创建完全自定义的玩家
     * new PlayerComponent(250, 4000, 150, 500);
     */
    constructor(
        movementSpeed: number = 200,
        skillCooldownTime: number = 5000,
        attackDuration: number = 200,
        projectileSpeed: number = 400
    ) {
        super();
        this.movementSpeed = movementSpeed;
        this.skillCooldownTime = skillCooldownTime;
        this.attackDuration = attackDuration;
        this.projectileSpeed = projectileSpeed;
        this.lastMoveDirection = { x: 1, y: 0 }; // 默认朝右
    }

    /**
     * 更新组件状态
     * 
     * 在每帧中更新玩家组件的状态，主要用于技能冷却倒计时。
     * 这个方法会被ComponentUpdateSystem自动调用。
     * 
     * @param deltaTime 自上次更新以来的时间差（毫秒）
     * @example
     * // 这个方法通常不需要手动调用，系统会自动处理
     * playerComponent.update(16.67); // 约60FPS的一帧时间
     */
    update(deltaTime: number): void {
        // 技能冷却倒计时
        if (this.skillCooldown > 0) {
            this.skillCooldown = Math.max(0, this.skillCooldown - deltaTime);
        }
    }

    /**
     * 使用技能
     * 
     * 尝试使用玩家技能，如果技能不在冷却中则启动冷却。
     * 返回值表示是否成功使用技能。
     * 
     * @returns 如果成功使用技能返回true，如果技能在冷却中返回false
     * @example
     * if (playerComponent.useSkill()) {
     *     console.log('技能释放成功！');
     *     // 创建投射物或执行其他技能效果
     * } else {
     *     console.log('技能还在冷却中...');
     * }
     */
    useSkill(): boolean {
        // 检查技能是否在冷却中
        if (this.skillCooldown > 0) {
            return false;
        }
        
        // 启动技能冷却
        this.skillCooldown = this.skillCooldownTime;
        return true;
    }

    /**
     * 检查是否可以使用技能
     * 
     * 查询技能是否已准备就绪（不在冷却中）。
     * 
     * @returns 如果可以使用技能返回true
     * @example
     * if (playerComponent.canUseSkill()) {
     *     // 显示技能可用的UI提示
     *     skillButton.setTint(0xffffff);
     * } else {
     *     // 显示技能冷却的UI提示
     *     skillButton.setTint(0x888888);
     * }
     */
    canUseSkill(): boolean {
        return this.skillCooldown <= 0;
    }

    /**
     * 获取技能冷却百分比
     * 
     * 返回当前技能冷却的进度百分比，用于UI显示。
     * 
     * @returns 冷却百分比，0表示可用，1表示刚使用完技能
     * @example
     * const cooldownPercent = playerComponent.getSkillCooldownPercent();
     * // 更新技能冷却UI
     * skillCooldownBar.setScale(cooldownPercent, 1);
     * 
     * // 显示剩余时间
     * const remainingTime = Math.ceil(cooldownPercent * skillCooldownTime / 1000);
     * skillText.setText(`${remainingTime}s`);
     */
    getSkillCooldownPercent(): number {
        return this.skillCooldown / this.skillCooldownTime;
    }

    /**
     * 获取剩余冷却时间（秒）
     * 
     * 返回技能剩余的冷却时间（以秒为单位），用于UI显示。
     * 
     * @returns 剩余冷却时间（秒），向上取整
     * @example
     * const remainingSeconds = playerComponent.getSkillCooldownSeconds();
     * if (remainingSeconds > 0) {
     *     console.log(`技能还需要 ${remainingSeconds} 秒才能使用`);
     * }
     */
    getSkillCooldownSeconds(): number {
        return Math.ceil(this.skillCooldown / 1000);
    }

    /**
     * 设置移动方向
     * 
     * 更新玩家的最后移动方向，这个方向会影响攻击和技能的释放方向。
     * 
     * @param x X方向的分量（-1到1）
     * @param y Y方向的分量（-1到1）
     * @example
     * // 向右移动
     * playerComponent.setMoveDirection(1, 0);
     * 
     * // 向左上方移动
     * playerComponent.setMoveDirection(-1, -1);
     * 
     * // 标准化对角线方向
     * const diagonal = Math.sqrt(2) / 2;
     * playerComponent.setMoveDirection(diagonal, diagonal);
     */
    setMoveDirection(x: number, y: number): void {
        // 只有在实际移动时才更新方向（避免零向量）
        if (x !== 0 || y !== 0) {
            this.lastMoveDirection.x = x;
            this.lastMoveDirection.y = y;
        }
    }

    /**
     * 获取移动方向
     * 
     * 返回玩家最后的移动方向。
     * 
     * @returns 包含x和y分量的方向对象
     * @example
     * const direction = playerComponent.getMoveDirection();
     * console.log(`玩家朝向: (${direction.x}, ${direction.y})`);
     */
    getMoveDirection(): { x: number; y: number } {
        return { x: this.lastMoveDirection.x, y: this.lastMoveDirection.y };
    }

    /**
     * 开始攻击
     * 
     * 标记玩家进入攻击状态，用于防止连续攻击。
     * 
     * @example
     * if (!playerComponent.isAttacking) {
     *     playerComponent.startAttack();
     *     // 执行攻击逻辑...
     * }
     */
    startAttack(): void {
        this.isAttacking = true;
    }

    /**
     * 结束攻击
     * 
     * 标记玩家攻击状态结束，允许再次攻击。
     * 通常在攻击动画完成或经过攻击持续时间后调用。
     * 
     * @example
     * // 在攻击持续时间后自动结束攻击
     * setTimeout(() => {
     *     playerComponent.endAttack();
     * }, playerComponent.attackDuration);
     */
    endAttack(): void {
        this.isAttacking = false;
    }

    /**
     * 重置技能冷却
     * 
     * 立即清除技能冷却，使技能可以立即使用。
     * 通常用于游戏作弊、特殊道具效果或关卡重置。
     * 
     * @example
     * // 使用道具重置技能冷却
     * if (usedResetItem) {
     *     playerComponent.resetSkillCooldown();
     *     console.log('技能冷却已重置！');
     * }
     */
    resetSkillCooldown(): void {
        this.skillCooldown = 0;
    }

    /**
     * 减少技能冷却时间
     * 
     * 减少指定的技能冷却时间，但不会低于0。
     * 可用于技能加速道具或特殊效果。
     * 
     * @param amount 要减少的时间（毫秒）
     * @example
     * // 使用加速道具减少1秒冷却
     * playerComponent.reduceSkillCooldown(1000);
     */
    reduceSkillCooldown(amount: number): void {
        this.skillCooldown = Math.max(0, this.skillCooldown - amount);
    }

    /**
     * 获取移动速度
     * 
     * 返回当前的移动速度值。
     * 
     * @returns 移动速度（像素/秒）
     */
    getMovementSpeed(): number {
        return this.movementSpeed;
    }

    /**
     * 设置移动速度
     * 
     * 更新玩家的移动速度，用于速度提升道具或状态效果。
     * 
     * @param speed 新的移动速度（像素/秒）
     * @example
     * // 使用速度提升道具
     * const originalSpeed = playerComponent.getMovementSpeed();
     * playerComponent.setMovementSpeed(originalSpeed * 1.5);
     */
    setMovementSpeed(speed: number): void {
        this.movementSpeed = Math.max(0, speed); // 确保速度不为负数
    }

    /**
     * 序列化玩家数据
     * 
     * 将玩家组件转换为可序列化的对象，用于保存游戏状态。
     * 
     * @returns 包含玩家数据的对象
     */
    serialize(): any {
        return {
            type: 'PlayerComponent',
            movementSpeed: this.movementSpeed,
            skillCooldown: this.skillCooldown,
            skillCooldownTime: this.skillCooldownTime,
            lastMoveDirection: { ...this.lastMoveDirection },
            isAttacking: this.isAttacking,
            attackDuration: this.attackDuration,
            projectileSpeed: this.projectileSpeed
        };
    }

    /**
     * 反序列化玩家数据
     * 
     * 从序列化数据恢复玩家组件的状态。
     * 
     * @param data 序列化的数据对象
     */
    deserialize(data: any): void {
        this.movementSpeed = data.movementSpeed || 200;
        this.skillCooldown = data.skillCooldown || 0;
        this.skillCooldownTime = data.skillCooldownTime || 5000;
        this.lastMoveDirection = data.lastMoveDirection || { x: 1, y: 0 };
        this.isAttacking = data.isAttacking || false;
        this.attackDuration = data.attackDuration || 200;
        this.projectileSpeed = data.projectileSpeed || 400;
    }
} 