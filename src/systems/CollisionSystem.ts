/**
 * 碰撞系统 - 处理游戏中所有碰撞检测和伤害逻辑
 * 
 * 碰撞系统负责检测并处理游戏中的各种碰撞事件，包括：
 * - 玩家与敌人的碰撞（造成玩家受伤）
 * - 投射物与敌人的碰撞（造成敌人受伤）
 * - 攻击范围与敌人的碰撞（近战攻击）
 * 
 * 主要功能：
 * - 实时碰撞检测和响应
 * - 伤害计算和应用
 * - 击退效果和动画
 * - 视觉特效（屏幕震动、闪光、护盾等）
 * - 音效触发和状态更新
 * 
 * 设计原则：
 * - 高效的碰撞检测算法
 * - 丰富的视觉反馈
 * - 避免重复伤害和异常状态
 * - 支持不同类型的碰撞响应
 * 
 * @example
 * // 在主场景中使用碰撞系统
 * const collisionSystem = new CollisionSystem(world, scene);
 * world.addSystem(collisionSystem);
 * 
 * // 手动检查攻击碰撞
 * const hitEnemies = collisionSystem.checkAttackCollisions(attackX, attackY, range, damage);
 */
import 'phaser';
import { System } from '../ecs/System';
import { TransformComponent } from '../components/TransformComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { HealthComponent } from '../components/HealthComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { ProjectileComponent } from '../components/ProjectileComponent';

export class CollisionSystem extends System {
    /** Phaser场景引用，用于创建视觉特效和音效 */
    private scene: Phaser.Scene;

    /**
     * 构造函数 - 初始化碰撞系统
     * 
     * @param world ECS世界实例
     * @param scene Phaser场景实例，用于访问游戏引擎功能
     */
    constructor(world: any, scene: Phaser.Scene) {
        super(world);
        this.scene = scene;
    }

    /**
     * 系统更新 - 每帧执行碰撞检测
     * 
     * 按顺序执行各种类型的碰撞检测：
     * 1. 玩家与敌人的碰撞（接触伤害）
     * 2. 投射物与敌人的碰撞（远程攻击）
     * 
     * @param deltaTime 帧时间间隔（毫秒）
     */
    update(deltaTime: number): void {
        // 检查玩家与敌人的碰撞
        this.checkPlayerEnemyCollisions();
        
        // 检查投射物与敌人的碰撞
        this.checkProjectileEnemyCollisions();
    }

    /**
     * 检查玩家与敌人的碰撞
     * 
     * 遍历所有玩家和敌人实体，检测它们之间的距离碰撞。
     * 当检测到碰撞时，触发玩家受伤逻辑和相关特效。
     * 
     * 碰撞逻辑：
     * - 使用圆形碰撞检测（基于距离）
     * - 检查玩家无敌状态，避免连续伤害
     * - 应用伤害、击退和视觉特效
     * - 检查玩家死亡状态
     */
    private checkPlayerEnemyCollisions(): void {
        // 获取所有玩家实体（通常只有一个）
        const playerEntities = this.getEntitiesWith(PlayerComponent, TransformComponent, HealthComponent, SpriteComponent);
        // 获取所有敌人实体
        const enemyEntities = this.getEntitiesWith(EnemyComponent, TransformComponent, SpriteComponent);

        // 如果没有玩家，跳过碰撞检测
        if (playerEntities.length === 0) return;

        // 获取玩家实体和相关组件
        const playerEntity = playerEntities[0];
        const playerTransform = playerEntity.getComponent(TransformComponent)!;
        const playerHealth = playerEntity.getComponent(HealthComponent)!;
        const playerSprite = playerEntity.getComponent(SpriteComponent)!;

        // 遍历所有敌人，检查与玩家的碰撞
        for (const enemyEntity of enemyEntities) {
            const enemyTransform = enemyEntity.getComponent(TransformComponent)!;
            const enemyComponent = enemyEntity.getComponent(EnemyComponent)!;
            const enemySprite = enemyEntity.getComponent(SpriteComponent)!;

            // 计算玩家与敌人之间的距离
            const distance = Phaser.Math.Distance.Between(
                playerTransform.x, playerTransform.y,
                enemyTransform.x, enemyTransform.y
            );

            // 碰撞检测半径（像素）
            const collisionDistance = 30;

            // 如果距离小于碰撞半径，发生碰撞
            if (distance < collisionDistance) {
                // 尝试对玩家造成伤害
                if (playerHealth.takeDamage(enemyComponent.damage)) {
                    // 伤害成功应用，设置无敌时间防止连续伤害
                    playerHealth.setInvincible(1000); // 1秒无敌时间

                    // 创建玩家受伤的视觉特效
                    this.createPlayerDamageEffect(playerSprite.sprite);

                    // 创建屏幕震动等全局特效
                    this.createScreenShake();

                    // 应用击退效果，将玩家推离敌人
                    this.applyKnockback(playerEntity, enemyTransform.x, enemyTransform.y, 100);

                    // 输出调试信息
                    console.log(`玩家受到 ${enemyComponent.damage} 点伤害，剩余血量: ${playerHealth.currentHealth}`);

                    // 检查玩家是否死亡
                    if (!playerHealth.isAlive()) {
                        // 触发玩家死亡事件
                        this.scene.events.emit('player-death', playerEntity);
                    }
                }
            }
        }
    }

    /**
     * 检查投射物与敌人的碰撞
     * 
     * 检测所有投射物与敌人的碰撞，应用伤害并销毁投射物。
     * 使用延迟删除机制避免在迭代过程中修改实体集合。
     * 
     * 碰撞逻辑：
     * - 圆形碰撞检测
     * - 立即销毁命中的投射物
     * - 对敌人造成伤害和击退
     * - 创建命中特效
     * - 安全的实体删除处理
     */
    private checkProjectileEnemyCollisions(): void {
        // 获取所有投射物和敌人实体
        const projectileEntities = this.getEntitiesWith(ProjectileComponent, TransformComponent, SpriteComponent);
        const enemyEntities = this.getEntitiesWith(EnemyComponent, TransformComponent, HealthComponent, SpriteComponent);
        
        // 使用数组来收集要删除的投射物，避免在迭代中修改数组
        const projectilesToRemove: any[] = [];

        for (const projectile of projectileEntities) {
            // 检查投射物组件是否仍然存在（防止运行时错误）
            const projectileTransform = projectile.getComponent(TransformComponent);
            const projectileComponent = projectile.getComponent(ProjectileComponent);
            const projectileSprite = projectile.getComponent(SpriteComponent);

            // 如果任何必要组件丢失，跳过这个投射物
            if (!projectileTransform || !projectileComponent || !projectileSprite) {
                continue;
            }

            let hitEnemy = false;

            // 检查与所有敌人的碰撞
            for (const enemy of enemyEntities) {
                const enemyTransform = enemy.getComponent(TransformComponent);
                const enemyHealth = enemy.getComponent(HealthComponent);
                const enemySprite = enemy.getComponent(SpriteComponent);

                // 如果任何必要组件丢失，跳过这个敌人
                if (!enemyTransform || !enemyHealth || !enemySprite) {
                    continue;
                }

                // 计算投射物与敌人之间的距离
                const distance = Phaser.Math.Distance.Between(
                    projectileTransform.x, projectileTransform.y,
                    enemyTransform.x, enemyTransform.y
                );

                const collisionDistance = 20; // 投射物碰撞半径

                if (distance < collisionDistance) {
                    // 敌人受到投射物伤害（忽略无敌帧，投射物伤害直接生效）
                    enemyHealth.takeDamage(projectileComponent.damage, true);

                    // 应用击退效果
                    this.applyEnemyKnockback(enemy, projectileTransform.x, projectileTransform.y, 150);

                    // 创建敌人受伤特效
                    this.createEnemyDamageEffect(enemySprite.sprite);

                    // 创建投射物命中的爆炸特效
                    this.createProjectileHitEffect(projectileTransform.x, projectileTransform.y);

                    console.log(`投射物击中敌人，造成 ${projectileComponent.damage} 点伤害，敌人剩余血量: ${enemyHealth.currentHealth}`);

                    // 标记投射物需要删除
                    projectilesToRemove.push(projectile);
                    hitEnemy = true;

                    // 检查敌人是否死亡
                    if (!enemyHealth.isAlive()) {
                        this.scene.events.emit('enemy-death', enemy);
                    }

                    break; // 投射物击中敌人，退出内循环
                }
            }

            if (hitEnemy) break; // 如果击中敌人，投射物已标记删除，不需要继续检查其他投射物
        }

        // 在迭代完成后删除投射物（避免迭代中修改集合的问题）
        for (const projectile of projectilesToRemove) {
            this.world.removeEntity(projectile);
        }
    }

    /**
     * 创建玩家受伤特效
     * 
     * 当玩家受到伤害时显示的视觉效果，包括：
     * - 青色光晕护盾效果（表示无敌状态）
     * - 护盾脉冲动画
     * - 发光边缘效果
     * - 轻微的角色染色
     * - 冲击缩放动画
     * 
     * @param sprite 玩家的Phaser精灵对象
     */
    private createPlayerDamageEffect(sprite: Phaser.Physics.Arcade.Sprite): void {
        // 创建光晕护罩效果，不让本体闪烁
        const shield = this.scene.add.circle(sprite.x, sprite.y, 25, 0x00ffff, 0.3);
        shield.setDepth(sprite.depth - 1);
        
        // 护罩跟随玩家移动（未使用的函数，保留用于扩展）
        const followShield = () => {
            if (shield.active) {
                shield.setPosition(sprite.x, sprite.y);
            }
        };
        
        // 护罩脉冲动画 - 呼吸般的缩放效果
        this.scene.tweens.add({
            targets: shield,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.6,
            duration: 300,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });

        // 护罩边缘发光效果 - 外圈发光环
        const glowRing = this.scene.add.circle(sprite.x, sprite.y, 28, 0x88ffff, 0);
        glowRing.setDepth(sprite.depth - 2);
        glowRing.setStrokeStyle(3, 0x00ffff, 0.8);

        // 发光环动画 - 快速闪烁效果
        this.scene.tweens.add({
            targets: glowRing,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.4,
            duration: 200,
            yoyo: true,
            repeat: 4,
            ease: 'Power2'
        });

        // 更新位置的定时器 - 确保护盾跟随玩家移动
        const updateTimer = this.scene.time.addEvent({
            delay: 16, // 约60FPS
            repeat: 62, // 大约1秒
            callback: () => {
                if (shield.active) {
                    shield.setPosition(sprite.x, sprite.y);
                }
                if (glowRing.active) {
                    glowRing.setPosition(sprite.x, sprite.y);
                }
            }
        });

        // 1秒后销毁护罩效果
        this.scene.time.delayedCall(1000, () => {
            if (shield.active) shield.destroy();
            if (glowRing.active) glowRing.destroy();
            updateTimer.destroy();
        });

        // 玩家本体只有轻微的红色染色，不闪烁
        sprite.setTint(0xff6666);
        this.scene.time.delayedCall(200, () => {
            sprite.clearTint();
        });

        // 精灵缩放效果增强冲击感
        this.scene.tweens.add({
            targets: sprite,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            yoyo: true,
            repeat: 1
        });
    }

    /**
     * 创建敌人受伤特效
     * 
     * 敌人受到伤害时的视觉反馈，包括：
     * - 橙红色闪烁效果
     * - 透明度变化
     * - 快速的颜色循环
     * 
     * @param sprite 敌人的Phaser精灵对象
     */
    private createEnemyDamageEffect(sprite: Phaser.Physics.Arcade.Sprite): void {
        // 敌人受伤效果 - 橙红色闪烁，不会看起来消失
        const colors = [0xff0000, 0xff6600, 0xff3300]; // 红、橙红、深红
        let colorIndex = 0;

        // 快速颜色闪烁效果
        const colorFlash = this.scene.time.addEvent({
            delay: 40,
            repeat: 6,
            callback: () => {
                sprite.setTint(colors[colorIndex % colors.length]);
                colorIndex++;
            }
        });

        // 透明度闪烁 - 保持可见性
        this.scene.tweens.add({
            targets: sprite,
            alpha: 0.7, // 不会太透明
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                sprite.setAlpha(1);
                sprite.clearTint();
                colorFlash.destroy();
            }
        });
    }

    /**
     * 创建屏幕震动效果
     * 
     * 玩家受伤时的全屏视觉反馈，增强打击感：
     * - 双重相机震动（强度递减）
     * - 慢动作效果
     * - 红色闪光覆盖层
     */
    private createScreenShake(): void {
        // 强烈的全屏相机抖动效果
        const camera = this.scene.cameras.main;
        
        // 第一次强烈抖动
        camera.shake(200, 0.03);
        
        // 延迟后第二次较弱抖动
        this.scene.time.delayedCall(150, () => {
            camera.shake(150, 0.015);
        });
        
        // 添加慢动作效果增强打击感
        this.scene.time.timeScale = 0.5;
        this.scene.time.delayedCall(120, () => {
            this.scene.time.timeScale = 0.8;
        });
        this.scene.time.delayedCall(200, () => {
            this.scene.time.timeScale = 1;
        });

        // 添加红色闪光覆盖层效果
        const flashOverlay = this.scene.add.rectangle(
            camera.centerX, camera.centerY,
            camera.width, camera.height,
            0xff0000, 0.3
        ).setDepth(999).setScrollFactor(0);

        this.scene.tweens.add({
            targets: flashOverlay,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                flashOverlay.destroy();
            }
        });
    }

    /**
     * 应用击退效果（通用）
     * 
     * 计算击退方向并应用速度，用于玩家被击退。
     * 
     * @param entity 要击退的实体
     * @param sourceX 击退来源的X坐标
     * @param sourceY 击退来源的Y坐标
     * @param force 击退力度
     */
    private applyKnockback(entity: any, sourceX: number, sourceY: number, force: number): void {
        const transform = entity.getComponent(TransformComponent);
        const velocity = entity.getComponent(VelocityComponent);

        if (transform && velocity) {
            // 计算击退方向 - 从来源指向目标的角度
            const angle = Phaser.Math.Angle.Between(
                sourceX, sourceY,
                transform.x, transform.y
            );

            // 根据角度和力度计算击退速度分量
            const knockbackX = Math.cos(angle) * force;
            const knockbackY = Math.sin(angle) * force;

            // 应用击退速度
            velocity.setVelocity(knockbackX, knockbackY);

            // 短时间后减缓速度，模拟摩擦力
            this.scene.time.delayedCall(300, () => {
                velocity.setVelocity(velocity.vx * 0.5, velocity.vy * 0.5);
            });
        }
    }

    /**
     * 检查攻击碰撞（近战攻击）
     * 
     * 手动检查指定位置和范围内的敌人，用于近战攻击。
     * 
     * @param attackX 攻击中心X坐标
     * @param attackY 攻击中心Y坐标
     * @param range 攻击范围半径
     * @param damage 攻击伤害值
     * @returns 被击中的敌人实体数组
     */
    checkAttackCollisions(attackX: number, attackY: number, range: number, damage: number): any[] {
        const enemyEntities = this.getEntitiesWith(EnemyComponent, TransformComponent, HealthComponent);
        const hitEnemies: any[] = [];

        for (const enemy of enemyEntities) {
            const enemyTransform = enemy.getComponent(TransformComponent)!;
            const enemyHealth = enemy.getComponent(HealthComponent)!;

            // 计算攻击点到敌人的距离
            const distance = Phaser.Math.Distance.Between(
                attackX, attackY,
                enemyTransform.x, enemyTransform.y
            );

            if (distance <= range) {
                // 敌人没有无敌帧，强制受到伤害
                enemyHealth.takeDamage(damage, true); // 忽略无敌帧

                // 强力击退效果 - 敌人会被明显推开
                this.applyEnemyKnockback(enemy, attackX, attackY, 200);

                // 敌人受伤特效
                const sprite = enemy.getComponent(SpriteComponent);
                if (sprite) {
                    this.createEnemyDamageEffect(sprite.sprite);
                }

                hitEnemies.push(enemy);

                console.log(`敌人受到 ${damage} 点伤害，剩余血量: ${enemyHealth.currentHealth}`);

                // 检查敌人是否死亡
                if (!enemyHealth.isAlive()) {
                    this.scene.events.emit('enemy-death', enemy);
                }
            }
        }

        return hitEnemies;
    }

    /**
     * 应用敌人击退效果
     * 
     * 专门用于敌人的击退效果，包括击退状态管理。
     * 
     * @param entity 敌人实体
     * @param sourceX 击退来源X坐标
     * @param sourceY 击退来源Y坐标
     * @param force 击退力度
     */
    private applyEnemyKnockback(entity: any, sourceX: number, sourceY: number, force: number): void {
        const transform = entity.getComponent(TransformComponent);
        const velocity = entity.getComponent(VelocityComponent);
        const enemyComponent = entity.getComponent(EnemyComponent);

        if (transform && velocity && enemyComponent) {
            // 计算击退方向
            const angle = Phaser.Math.Angle.Between(
                sourceX, sourceY,
                transform.x, transform.y
            );

            const knockbackX = Math.cos(angle) * force;
            const knockbackY = Math.sin(angle) * force;

            // 应用击退速度
            velocity.setVelocity(knockbackX, knockbackY);

            // 设置击退状态，防止敌人立即追击
            enemyComponent.setKnockback(true);

            // 击退持续时间更长，让敌人明显被推开
            this.scene.time.delayedCall(500, () => {
                enemyComponent.setKnockback(false);
                // 逐渐减速
                velocity.setVelocity(velocity.vx * 0.3, velocity.vy * 0.3);
            });
        }
    }

    /**
     * 创建投射物命中特效
     * 
     * 投射物击中敌人时的爆炸效果：
     * - 黄色爆炸圆圈
     * - 放射状火花粒子
     * - 缩放和淡出动画
     * 
     * @param x 爆炸中心X坐标
     * @param y 爆炸中心Y坐标
     */
    private createProjectileHitEffect(x: number, y: number): void {
        // 创建投射物命中的爆炸效果
        const hitEffect = this.scene.add.circle(x, y, 15, 0xffff00, 0.8);
        hitEffect.setDepth(5);

        // 爆炸动画 - 放大并淡出
        this.scene.tweens.add({
            targets: hitEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                hitEffect.destroy();
            }
        });

        // 添加火花粒子效果 - 6个方向的火花
        for (let i = 0; i < 6; i++) {
            const spark = this.scene.add.circle(x, y, 3, 0xff8800, 0.9);
            const angle = (Math.PI * 2 * i) / 6; // 平均分布6个方向
            const distance = 30;

            // 火花向外飞散的动画
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    spark.destroy();
                }
            });
        }
    }
}