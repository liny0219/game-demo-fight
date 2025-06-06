import { Scene } from 'phaser';
import { Logger } from '../utils/Logger';
import { Debug } from '../utils/Debug';

interface GameOverData {
    score: number;
    wave: number;
}

export class GameOverScene extends Scene {
    private logger: Logger;
    private debug: Debug;

    constructor() {
        super({ key: 'GameOverScene' });
        this.logger = Logger.getInstance();
        this.debug = Debug.getInstance();
    }

    init(data: GameOverData): void {
        // 清理之前场景的调试信息
        this.debug.destroy();
    }

    create(data: GameOverData): void {
        this.logger.log('Scene', 'GameOverScene created');
        this.debug.init(this);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建半透明黑色背景
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0);

        // 创建游戏结束标题
        this.add.text(width / 2, height / 3, '游戏结束', {
            fontSize: '64px',
            color: '#ff0000',
            stroke: '#000',
            strokeThickness: 8,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 显示得分和波数
        this.add.text(width / 2, height / 2, [
            `得分: ${data.score}`,
            `波数: ${data.wave}`
        ], {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center',
            lineSpacing: 20
        }).setOrigin(0.5);

        // 创建重新开始按钮
        const restartButton = this.add.text(width / 2, height * 2 / 3, '点击重新开始', {
            fontSize: '32px',
            color: '#00ff00',
            backgroundColor: '#000000',
            stroke: '#000',
            strokeThickness: 4,
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // 添加按钮动画
        this.tweens.add({
            targets: restartButton,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 添加点击事件
        restartButton.on('pointerdown', () => {
            this.debug.logEvent('Game', 'Restart clicked');
            // 清理当前场景
            this.debug.destroy();
            // 启动主场景
            this.scene.start('MainScene');
        });

        // 添加渐入动画
        this.cameras.main.fadeIn(1000);
    }

    shutdown(): void {
        // 清理场景资源
        this.debug.destroy();
    }
}
