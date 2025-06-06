import { Scene } from 'phaser';

export class Enemy {
    private scene: Scene;
    private sprite: Phaser.Physics.Arcade.Sprite;
    private target: Phaser.Physics.Arcade.Sprite;
    private health: number = 200; // 初始血量设置为200，代表两管血
    private readonly MOVEMENT_SPEED: number = 100;

    // 血条常量
    private readonly HEALTH_BAR_WIDTH: number = 32; // 与敌人精灵宽度一致
    private readonly HEALTH_BAR_HEIGHT: number = 4;
    private readonly HEALTH_BAR_Y_OFFSET: number = -20;
    private readonly MAX_HEALTH_PER_BAR: number = 100; // 每管血代表的血量值

    private healthBarBackground?: Phaser.GameObjects.Rectangle;
    private healthBar?: Phaser.GameObjects.Rectangle;
    private healthBarTrail?: Phaser.GameObjects.Rectangle;
    private trailTween?: Phaser.Tweens.Tween;
    private multiplierText?: Phaser.GameObjects.Text; // 用于显示血量倍数

    private knockbackActive: boolean = false;

    constructor(scene: Scene, x: number, y: number, target: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.target = target;
        
        // 创建敌人精灵
        this.sprite = scene.physics.add.sprite(x, y, 'enemy');
        this.sprite.setCollideWorldBounds(true);
        
        // 设置碰撞体积
        this.sprite.setSize(32, 32);
        this.sprite.setDisplaySize(32, 32);

        // 创建血条
        this.createHealthBar();
    }

    /**
     * 创建敌人的血条。
     * 血条由背景、拖影和实际血量条组成，并位于敌人精灵的上方。
     */
    private createHealthBar(): void {
        // 确保血条只创建一次，如果已经存在则先销毁
        this.destroyHealthBars();

        const barX = this.sprite.x - (this.HEALTH_BAR_WIDTH / 2);

        // 血条背景
        this.healthBarBackground = this.scene.add.rectangle(
            barX,
            this.sprite.y + this.HEALTH_BAR_Y_OFFSET,
            this.HEALTH_BAR_WIDTH,
            this.HEALTH_BAR_HEIGHT,
            0x000000 // 黑色背景
        ).setDepth(1);

        // 血条拖影
        this.healthBarTrail = this.scene.add.rectangle(
            barX,
            this.sprite.y + this.HEALTH_BAR_Y_OFFSET,
            this.HEALTH_BAR_WIDTH,
            this.HEALTH_BAR_HEIGHT,
            0x000000 // 初始为黑色，避免干扰
        ).setDepth(2);

        // 实际血条
        this.healthBar = this.scene.add.rectangle(
            barX,
            this.sprite.y + this.HEALTH_BAR_Y_OFFSET,
            this.HEALTH_BAR_WIDTH,
            this.HEALTH_BAR_HEIGHT,
            0xff0000 // 初始为红色血条
        ).setDepth(3);

        // 确保血条居左对齐，垂直居中
        this.healthBarBackground.setOrigin(0, 0.5);
        this.healthBarTrail.setOrigin(0, 0.5);
        this.healthBar.setOrigin(0, 0.5);

        // 创建血量倍数文本
        this.multiplierText = this.scene.add.text(
            barX + this.HEALTH_BAR_WIDTH + 5, // 放置在血条右侧，留出5像素间距
            this.sprite.y + this.HEALTH_BAR_Y_OFFSET,
            '', // 初始为空
            { fontSize: '8px', color: '#ffffff' }
        ).setOrigin(0, 0.5).setDepth(3); // 与血条同深度或更高
    }

    /**
     * 每帧更新敌人的状态，包括移动和血条位置。
     */
    update(): void {
        if (!this.isAlive()) {
            this.destroy();
            return;
        }

        // 如果正在击退，不要移动，但血条位置仍需更新
        if (!this.knockbackActive) {
            // 朝向目标移动
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x, this.sprite.y,
                this.target.x, this.target.y
            );

            this.sprite.setVelocity(
                Math.cos(angle) * this.MOVEMENT_SPEED,
                Math.sin(angle) * this.MOVEMENT_SPEED
            );
        }

        // 更新血条位置
        this.updateHealthBar();
    }

    /**
     * 更新血条的位置和显示。
     * 确保血条始终跟随敌人精灵，并正确显示血量百分比。
     */
    private updateHealthBar(): void {
        // 确保血条对象已创建
        if (!this.healthBar || !this.healthBarBackground || !this.healthBarTrail) {
            return;
        }

        // 计算当前血量相对于单管血的百分比
        let currentBarHealth = this.health % this.MAX_HEALTH_PER_BAR;
        if (currentBarHealth === 0 && this.health > 0) {
            currentBarHealth = this.MAX_HEALTH_PER_BAR; // 如果是100, 200等整管血，显示满条
        } else if (this.health === 0) {
            currentBarHealth = 0;
        }

        const healthWidth = (currentBarHealth / this.MAX_HEALTH_PER_BAR) * this.HEALTH_BAR_WIDTH;

        // 计算血条的X坐标，使其左边缘与敌人精灵的左边缘对齐
        const barX = this.sprite.x - (this.HEALTH_BAR_WIDTH / 2);
        const barY = this.sprite.y + this.HEALTH_BAR_Y_OFFSET;

        // 更新血条背景位置
        this.healthBarBackground.setPosition(barX, barY);
        // 更新拖影位置
        this.healthBarTrail.setPosition(barX, barY);
        // 更新实际血条位置
        this.healthBar.setPosition(barX, barY);

        // 更新血条宽度
        this.healthBar.setSize(healthWidth, this.HEALTH_BAR_HEIGHT);
        this.healthBarTrail.setSize(healthWidth, this.HEALTH_BAR_HEIGHT);

        // 根据血量改变血条颜色
        if (this.health > this.MAX_HEALTH_PER_BAR) {
            console.log('Enemy Health:', this.health, ' > MAX_HEALTH_PER_BAR:', this.MAX_HEALTH_PER_BAR, ' -> Green (Test)');
            this.healthBar.setFillStyle(0x00ff00); // 测试：绿色
            this.healthBarTrail.setFillStyle(0x90ee90, 0); // 测试：浅绿色拖影，透明度为0
        } else {
            console.log('Enemy Health:', this.health, ' <= MAX_HEALTH_PER_BAR:', this.MAX_HEALTH_PER_BAR, ' -> Red');
            this.healthBar.setFillStyle(0xff0000); // 红色
            this.healthBarTrail.setFillStyle(0xff0000, 0); // 拖影颜色与血条一致，透明度为0
        }

        // 更新血量倍数文本
        if (this.multiplierText) {
            const currentMultiplier = Math.ceil(this.health / this.MAX_HEALTH_PER_BAR);
            if (currentMultiplier > 1) {
                this.multiplierText.setText(`x${currentMultiplier}`);
                this.multiplierText.setPosition(barX + this.HEALTH_BAR_WIDTH + 5, barY);
                this.multiplierText.setVisible(true);
            } else {
                this.multiplierText.setVisible(false);
            }
        }
    }

    /**
     * 敌人受到伤害。
     * @param amount 问题：血条颜色在血量超过一管时仍显示红色，即使控制台输出显示应该为蓝色。
原因：Phaser 的渲染机制可能存在问题，或者有其他代码在覆盖血条的颜色。
解决方案：
1. 确保血条拖影的颜色与主血条颜色一致。
2. 将测试用的绿色改回蓝色。
3. 移除错误的 `texture.setDirty()` 调用。
4. 再次要求用户运行游戏并观察血条颜色。
*/
    takeDamage(amount: number): void {
        if (!this.isAlive()) return;

        this.health = Math.max(0, this.health - amount);
        
        // 受伤闪烁效果
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 1
        });

        // 更新血条
        if (this.healthBar && this.healthBarTrail) {
            // 计算当前血量相对于单管血的百分比
            let currentBarHealth = this.health % this.MAX_HEALTH_PER_BAR;
            if (currentBarHealth === 0 && this.health > 0) {
                currentBarHealth = this.MAX_HEALTH_PER_BAR;
            } else if (this.health === 0) {
                currentBarHealth = 0;
            }

            const newWidth = (currentBarHealth / this.MAX_HEALTH_PER_BAR) * this.HEALTH_BAR_WIDTH;

            // 更新实际血条
            this.healthBar.setSize(newWidth, this.HEALTH_BAR_HEIGHT);
            
            // 创建拖影动画
            if (this.trailTween) {
                this.trailTween.stop();
            }

            this.trailTween = this.scene.tweens.add({
                targets: this.healthBarTrail,
                width: newWidth,
                duration: 500,
                ease: 'Power2'
            });
        }

        // 如果死亡，添加消失动画
        if (this.health <= 0) {
            this.scene.tweens.add({
                targets: [this.sprite, this.healthBar, this.healthBarBackground, this.healthBarTrail],
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => this.destroy()
            });
        }
    }

    /**
     * 击退敌人。
     * @param sourceX 击退来源的X坐标。
     * @param sourceY 击退来源的Y坐标。
     * @param force 参数击退力度。
     */
    knockback(sourceX: number, sourceY: number, force: number = 150): void {
        if (this.knockbackActive) return;
        
        // 计算击退方向
        const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.sprite.x, this.sprite.y);
        
        // 设置击退速度
        this.sprite.setVelocity(
            Math.cos(angle) * force,
            Math.sin(angle) * force
        );
        
        // 标记为正在击退
        this.knockbackActive = true;
        
        // 短暂延迟后恢复移动
        this.scene.time.delayedCall(300, () => {
            this.knockbackActive = false;
        });
    }

    /**
     * 设置敌人的当前血量。
     * @param health 新的血量值。
     */
    setHealth(health: number): void {
        this.health = health;
        this.updateHealthBar();
    }

    /**
     * 获取敌人的精灵对象。
     * @returns 敌人的Phaser精灵对象。
     */
    getSprite(): Phaser.Physics.Arcade.Sprite {
        return this.sprite;
    }

    /**
     * 检查敌人是否存活。
     * @returns 如果敌人血量大于0则返回true，否则返回false。
     */
    isAlive(): boolean {
        return this.health > 0;
    }

    /**
     * 销毁敌人及其血条对象。
     */
    destroy(): void {
        this.destroyHealthBars();
        if (this.sprite) {
            this.sprite.destroy();
        }
    }

    /**
     * 销毁血条相关的Phaser对象。
     */
    private destroyHealthBars(): void {
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = undefined;
        }
        if (this.healthBarBackground) {
            this.healthBarBackground.destroy();
            this.healthBarBackground = undefined;
        }
        if (this.healthBarTrail) {
            this.healthBarTrail.destroy();
            this.healthBarTrail = undefined;
        }
        if (this.multiplierText) {
            this.multiplierText.destroy();
            this.multiplierText = undefined;
        }
    }
}
