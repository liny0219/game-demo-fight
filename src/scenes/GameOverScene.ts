import 'phaser';

export class GameOverScene extends Phaser.Scene {
    private score: number = 0;
    private wave: number = 0;

    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data: { score: number; wave: number }): void {
        this.score = data.score || 0;
        this.wave = data.wave || 0;
    }

    create(): void {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // 背景
        this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8);

        // 游戏结束标题
        this.add.text(centerX, centerY - 150, '游戏结束', {
            fontSize: '48px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 最终得分
        this.add.text(centerX, centerY - 80, `最终得分: ${this.score}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 到达波数
        this.add.text(centerX, centerY - 40, `到达波数: ${this.wave}`, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 重新开始按钮
        const restartButton = this.add.text(centerX, centerY + 40, '重新开始', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        // 提示信息
        this.add.text(centerX, centerY + 120, '点击"重新开始"或按任意键重新游戏', {
            fontSize: '16px',
            color: '#cccccc'
        }).setOrigin(0.5);

        // 键盘重新开始
        this.input.keyboard?.once('keydown', () => {
            this.scene.start('MainScene');
        });

        // 触摸重新开始
        this.input.once('pointerdown', () => {
            this.scene.start('MainScene');
        });

        console.log(`游戏结束场景创建完成 - 得分: ${this.score}, 波数: ${this.wave}`);
    }
} 