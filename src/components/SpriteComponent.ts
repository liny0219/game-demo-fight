import 'phaser';
import { Component } from '../ecs/Component';

export class SpriteComponent extends Component {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public textureKey: string;
    public visible: boolean = true;
    public alpha: number = 1;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        super();
        this.textureKey = textureKey;
        this.sprite = scene.physics.add.sprite(x, y, textureKey);
        this.sprite.setCollideWorldBounds(true);
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        this.sprite.setVisible(visible);
    }

    setAlpha(alpha: number): void {
        this.alpha = alpha;
        this.sprite.setAlpha(alpha);
    }

    setSize(width: number, height: number): void {
        this.sprite.setSize(width, height);
        this.sprite.setDisplaySize(width, height);
    }

    setDepth(depth: number): void {
        this.sprite.setDepth(depth);
    }

    destroy(): void {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
} 