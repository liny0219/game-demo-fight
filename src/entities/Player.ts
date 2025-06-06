import { Scene } from 'phaser';

export class Player {
    private scene: Scene;
    private sprite: Phaser.Physics.Arcade.Sprite;
    private attackBox?: Phaser.GameObjects.Rectangle;
    private projectiles: Phaser.Physics.Arcade.Sprite[] = [];
    private skillCooldown: number = 0;
    private readonly SKILL_COOLDOWN_TIME: number = 5000; // 5秒冷却时间
    private readonly MOVEMENT_SPEED: number = 200;
    private readonly PROJECTILE_SPEED: number = 400;
    private readonly ATTACK_DURATION: number = 200;
    private isAttacking: boolean = false;
    private touchStartTime: number = 0;
    private touchStartPosition: { x: number; y: number } | null = null;
    private lastMoveDirection: { x: number; y: number } = { x: 1, y: 0 }; // 默认朝右
    private isDead: boolean = false;
    private maxHealth: number = 100;
    private health: number = this.maxHealth;
    private healthBar?: Phaser.GameObjects.Rectangle;
    private healthBarBackground?: Phaser.GameObjects.Rectangle;
    private isInvincible: boolean = false;
    private invincibleTime: number = 1000; // 1秒无敌时间

    constructor(scene: Scene, x: number, y: number) {
        this.scene = scene;
        
        // 创建玩家精灵
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setCollideWorldBounds(true);
        
        // 设置碰撞体积
        this.sprite.setSize(32, 32);
        this.sprite.setDisplaySize(32, 32);

        // 创建血条
        this.createHealthBar();

        // 设置控制键
        this.setupControls();
    }

    private createHealthBar(): void {
        const width = 50;
        const height = 6;
        const x = this.sprite.x - width / 2;
        const y = this.sprite.y - this.sprite.height / 2 - height - 2;

        // 血条背景
        this.healthBarBackground = this.scene.add.rectangle(
            x + width / 2,
            y + height / 2,
            width,
            height,
            0x000000
        ).setDepth(1);

        // 血条
        this.healthBar = this.scene.add.rectangle(
            x + width / 2,
            y + height / 2,
            width,
            height,
            0x00ff00
        ).setDepth(2);
    }

    private updateHealthBar(): void {
        if (!this.healthBar || !this.healthBarBackground) return;

        const width = 50;
        const height = 6;
        const x = this.sprite.x - width / 2;
        const y = this.sprite.y - this.sprite.height / 2 - height - 2;

        // 更新血条位置
        this.healthBarBackground.setPosition(x + width / 2, y + height / 2);
        
        // 更新血条宽度和位置
        const healthWidth = (this.health / this.maxHealth) * width;
        this.healthBar.setPosition(x + healthWidth / 2, y + height / 2);
        this.healthBar.setSize(healthWidth, height);
    }

    private setupControls(): void {
        // 添加键盘控制
        this.scene.input.keyboard?.on('keydown-SPACE', () => this.attack());
        this.scene.input.keyboard?.on('keydown-SHIFT', () => this.useSkill());

        // 添加触摸控制
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.touchStartTime = this.scene.time.now;
            this.touchStartPosition = { x: pointer.x, y: pointer.y };

            // 更新攻击方向
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x, this.sprite.y,
                pointer.x, pointer.y
            );
            this.lastMoveDirection = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            // 立即攻击
            this.attack();
        });

        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            const touchDuration = this.scene.time.now - this.touchStartTime;
            
            if (this.touchStartPosition) {
                const distance = Phaser.Math.Distance.Between(
                    this.touchStartPosition.x,
                    this.touchStartPosition.y,
                    pointer.x,
                    pointer.y
                );

                // 如果长按且移动距离小，释放技能
                if (touchDuration > 500 && distance < 10) {
                    this.useSkill();
                }
            }

            this.touchStartPosition = null;
            this.sprite.setVelocity(0, 0);
        });

        // 添加移动控制
        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown && this.touchStartPosition) {
                const distance = Phaser.Math.Distance.Between(
                    this.touchStartPosition.x,
                    this.touchStartPosition.y,
                    pointer.x,
                    pointer.y
                );

                // 如果移动距离足够大，更新移动方向
                if (distance > 10) {
                    const angle = Phaser.Math.Angle.Between(
                        this.sprite.x,
                        this.sprite.y,
                        pointer.x,
                        pointer.y
                    );

                    const moveX = Math.cos(angle);
                    const moveY = Math.sin(angle);
                    this.lastMoveDirection = { x: moveX, y: moveY };

                    this.sprite.setVelocity(
                        moveX * this.MOVEMENT_SPEED,
                        moveY * this.MOVEMENT_SPEED
                    );
                }
            }
        });
    }

    update(): void {
        if (this.isDead) return;

        // 更新技能冷却
        if (this.skillCooldown > 0) {
            this.skillCooldown = Math.max(0, this.skillCooldown - this.scene.sys.game.loop.delta);
        }

        // 处理移动输入
        const cursors = this.scene.input.keyboard?.createCursorKeys();
        
        if (cursors) {
            // 键盘控制
            const moveX = (cursors.left.isDown ? -1 : 0) + (cursors.right.isDown ? 1 : 0);
            const moveY = (cursors.up.isDown ? -1 : 0) + (cursors.down.isDown ? 1 : 0);
            
            if (moveX !== 0 || moveY !== 0) {
                // 更新最后移动方向
                this.lastMoveDirection = {
                    x: moveX,
                    y: moveY
                };

                // 标准化向量以保持对角线移动速度一致
                const length = Math.sqrt(moveX * moveX + moveY * moveY);
                this.sprite.setVelocity(
                    (moveX / length) * this.MOVEMENT_SPEED,
                    (moveY / length) * this.MOVEMENT_SPEED
                );
            } else if (!this.scene.input.activePointer.isDown) {
                this.sprite.setVelocity(0, 0);
            }
        }

        // 更新攻击框位置
        if (this.attackBox) {
            const offset = 20; // 攻击框偏移距离
            this.attackBox.setPosition(
                this.sprite.x + this.lastMoveDirection.x * offset,
                this.sprite.y + this.lastMoveDirection.y * offset
            );
        }

        // 更新血条位置
        this.updateHealthBar();

        // 无敌状态闪烁效果
        if (this.isInvincible) {
            this.sprite.alpha = Math.sin(this.scene.time.now * 0.01) * 0.3 + 0.7;
        }
    }

    attack(): void {
        if (this.isAttacking || this.isDead) return;
        this.isAttacking = true;

        // 创建攻击框
        if (this.attackBox) {
            this.attackBox.destroy();
        }

        // 根据最后移动方向创建攻击框
        const offset = 20; // 攻击框偏移距离
        this.attackBox = this.scene.add.rectangle(
            this.sprite.x + this.lastMoveDirection.x * offset,
            this.sprite.y + this.lastMoveDirection.y * offset,
            40,
            40,
            0xffff00,
            0.5
        );

        // 添加攻击动画
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.sprite.setScale(1);
            }
        });

        // 攻击持续时间后移除攻击框
        this.scene.time.delayedCall(this.ATTACK_DURATION, () => {
            if (this.attackBox) {
                this.attackBox.destroy();
                this.attackBox = undefined;
            }
            this.isAttacking = false;
        });
    }

    useSkill(): void {
        if (this.skillCooldown > 0 || this.isDead) return;

        // 发射多个投射物
        const angles = [-30, -15, 0, 15, 30];
        const baseAngle = Math.atan2(this.lastMoveDirection.y, this.lastMoveDirection.x);

        angles.forEach(offset => {
            const angle = baseAngle + Phaser.Math.DegToRad(offset);
            const projectile = this.scene.physics.add.sprite(
                this.sprite.x,
                this.sprite.y,
                'projectile'
            );
            
            projectile.setVelocity(
                Math.cos(angle) * this.PROJECTILE_SPEED,
                Math.sin(angle) * this.PROJECTILE_SPEED
            );

            this.projectiles.push(projectile);

            // 添加发射动画
            this.scene.tweens.add({
                targets: projectile,
                alpha: { from: 1, to: 0.8 },
                scale: { from: 1.2, to: 1 },
                duration: 100
            });

            // 3秒后移除投射物
            this.scene.time.delayedCall(3000, () => {
                projectile.destroy();
                this.projectiles = this.projectiles.filter(p => p !== projectile);
            });
        });

        // 添加技能释放动画
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });

        // 设置技能冷却
        this.skillCooldown = this.SKILL_COOLDOWN_TIME;
    }

    takeDamage(amount: number, sourceX?: number, sourceY?: number): void {
        if (this.isDead || this.isInvincible) return;
        
        this.health = Math.max(0, this.health - amount);
        
        // 受伤闪烁效果
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        // 受伤震动效果
        this.scene.cameras.main.shake(200, 0.01);

        // 受伤击退效果
        if (sourceX !== undefined && sourceY !== undefined) {
            const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.sprite.x, this.sprite.y);
            this.sprite.setVelocity(
                Math.cos(angle) * 300,
                Math.sin(angle) * 300
            );
            
            // 短暂延迟后停止击退
            this.scene.time.delayedCall(200, () => {
                if (!this.isDead) this.sprite.setVelocity(0, 0);
            });
        }

        // 设置无敌状态
        this.isInvincible = true;
        this.scene.time.delayedCall(this.invincibleTime, () => {
            this.isInvincible = false;
            this.sprite.alpha = 1; // 恢复正常透明度
        });

        // 检查是否死亡
        if (this.health <= 0) {
            this.isDead = true;
            this.sprite.setTint(0xff0000);
        }
    }

    getSprite(): Phaser.Physics.Arcade.Sprite {
        return this.sprite;
    }

    getAttackBox(): Phaser.GameObjects.Rectangle | undefined {
        return this.attackBox;
    }

    getProjectiles(): Phaser.Physics.Arcade.Sprite[] {
        return this.projectiles;
    }

    getSkillCooldown(): number {
        return this.skillCooldown;
    }

    isPlayerDead(): boolean {
        return this.isDead;
    }

    getHealth(): number {
        return this.health;
    }

    getMaxHealth(): number {
        return this.maxHealth;
    }

    isPlayerInvincible(): boolean {
        return this.isInvincible;
    }
}
