import { Scene } from 'phaser';

export class AssetManager {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    preloadAssets(): void {
        // 加载音效
        this.scene.load.audio('wave_start', 'assets/sounds/wave_start.wav');
        this.scene.load.audio('countdown', 'assets/sounds/countdown.wav');

        // 加载图片
        this.scene.load.image('player', 'assets/images/player.png');
        this.scene.load.image('enemy', 'assets/images/enemy.png');
        this.scene.load.image('projectile', 'assets/images/projectile.png');
        this.scene.load.image('attack_box', 'assets/images/attack_box.png');
    }

    createDefaultAssets(): void {
        // 如果资源加载失败，创建默认图形
        if (!this.scene.textures.exists('player')) {
            this.createDefaultRectangle('player', 0x00ff00); // 绿色玩家
        }
        if (!this.scene.textures.exists('enemy')) {
            this.createDefaultRectangle('enemy', 0xff0000); // 红色敌人
        }
        if (!this.scene.textures.exists('projectile')) {
            this.createDefaultRectangle('projectile', 0x00ffff, 10); // 青色投射物
        }
        if (!this.scene.textures.exists('attack_box')) {
            this.createDefaultRectangle('attack_box', 0xffff00, 40, 0.5); // 半透明黄色攻击框
        }
    }

    private createDefaultRectangle(key: string, color: number, size: number = 32, alpha: number = 1): void {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, alpha);
        graphics.fillRect(0, 0, size, size);
        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }
}
