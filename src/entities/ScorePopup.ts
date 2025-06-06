import { Scene } from 'phaser';

export class ScorePopup {
    private scene: Scene;
    private text: Phaser.GameObjects.Text;

    constructor(scene: Scene, x: number, y: number, score: number) {
        this.scene = scene;
        
        // 创建得分文本
        this.text = scene.add.text(x, y, `+${score}`, {
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 添加上浮和淡出动画
        scene.tweens.add({
            targets: this.text,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.text.destroy();
            }
        });

        // 添加缩放动画
        scene.tweens.add({
            targets: this.text,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 100,
            yoyo: true,
            ease: 'Bounce'
        });
    }
}
