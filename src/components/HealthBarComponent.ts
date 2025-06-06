import 'phaser';
import { Component } from '../ecs/Component';

export class HealthBarComponent extends Component {
    public background?: Phaser.GameObjects.Rectangle;
    public bar?: Phaser.GameObjects.Rectangle;
    public trail?: Phaser.GameObjects.Rectangle;
    public multiplierText?: Phaser.GameObjects.Text;
    
    public width: number;
    public height: number;
    public yOffset: number;
    public maxHealthPerBar: number;

    private scene: Phaser.Scene;

    constructor(
        scene: Phaser.Scene,
        width: number = 50,
        height: number = 6,
        yOffset: number = -25,
        maxHealthPerBar: number = 100
    ) {
        super();
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.yOffset = yOffset;
        this.maxHealthPerBar = maxHealthPerBar;
    }

    createHealthBar(x: number, y: number): void {
        this.destroyHealthBar();

        const barX = x - (this.width / 2);
        const barY = y + this.yOffset;

        // 背景
        this.background = this.scene.add.rectangle(
            barX,
            barY,
            this.width,
            this.height,
            0x333333
        ).setDepth(10).setAlpha(0.8).setOrigin(0, 0.5);

        // 拖影
        this.trail = this.scene.add.rectangle(
            barX,
            barY,
            this.width,
            this.height,
            0x000000
        ).setDepth(11).setOrigin(0, 0.5);

        // 实际血条
        this.bar = this.scene.add.rectangle(
            barX,
            barY,
            this.width,
            this.height,
            0xff0000
        ).setDepth(12).setOrigin(0, 0.5);

        // 倍数文本
        this.multiplierText = this.scene.add.text(
            barX + this.width + 5,
            barY,
            '',
            { fontSize: '8px', color: '#ffffff' }
        ).setOrigin(0, 0.5).setDepth(13);
    }

    updateHealthBar(x: number, y: number, currentHealth: number, maxHealth: number): void {
        if (!this.bar || !this.background || !this.trail) return;

        const barX = x - (this.width / 2);
        const barY = y + this.yOffset;

        // 计算当前血量相对于单管血的百分比
        let currentBarHealth = currentHealth % this.maxHealthPerBar;
        if (currentBarHealth === 0 && currentHealth > 0) {
            currentBarHealth = this.maxHealthPerBar;
        } else if (currentHealth === 0) {
            currentBarHealth = 0;
        }

        const healthWidth = (currentBarHealth / this.maxHealthPerBar) * this.width;

        // 更新位置
        this.background.setPosition(barX, barY);
        this.trail.setPosition(barX, barY);
        this.bar.setPosition(barX, barY);

        // 更新宽度
        this.bar.setSize(healthWidth, this.height);
        this.trail.setSize(healthWidth, this.height);

        // 更新颜色
        if (currentHealth > this.maxHealthPerBar) {
            this.bar.setFillStyle(0x00ff00); // 绿色
            this.trail.setFillStyle(0x90ee90, 0);
        } else {
            this.bar.setFillStyle(0xff0000); // 红色
            this.trail.setFillStyle(0xff0000, 0);
        }

        // 更新倍数文本
        if (this.multiplierText) {
            const currentMultiplier = Math.ceil(currentHealth / this.maxHealthPerBar);
            if (currentMultiplier > 1) {
                this.multiplierText.setText(`x${currentMultiplier}`);
                this.multiplierText.setPosition(barX + this.width + 5, barY);
                this.multiplierText.setVisible(true);
            } else {
                this.multiplierText.setVisible(false);
            }
        }
    }

    destroyHealthBar(): void {
        if (this.background) {
            this.background.destroy();
            this.background = undefined;
        }
        if (this.bar) {
            this.bar.destroy();
            this.bar = undefined;
        }
        if (this.trail) {
            this.trail.destroy();
            this.trail = undefined;
        }
        if (this.multiplierText) {
            this.multiplierText.destroy();
            this.multiplierText = undefined;
        }
    }

    destroy(): void {
        this.destroyHealthBar();
    }
} 