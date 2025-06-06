import 'phaser';
import { Component } from '../ecs/Component';

export class SpriteComponent extends Component {
    private _sprite: Phaser.Physics.Arcade.Sprite | null = null;
    public textureKey: string;
    public visible: boolean = true;
    public alpha: number = 1;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        super();
        console.log(`[SpriteComponent] 开始创建精灵: ${textureKey} at (${x}, ${y})`);
        this.textureKey = textureKey;
        this.initializeSprite(scene, x, y);
    }

    private initializeSprite(scene: Phaser.Scene, x: number, y: number): void {
        try {
            console.log(`[SpriteComponent] 检查贴图是否存在: ${this.textureKey}`);
            // 确保贴图存在
            if (!scene.textures.exists(this.textureKey)) {
                console.warn(`[SpriteComponent] 贴图不存在: ${this.textureKey}`);
                return;
            }

            console.log(`[SpriteComponent] 创建物理精灵: ${this.textureKey}`);
            // 创建精灵并设置物理属性
            this._sprite = scene.physics.add.sprite(x, y, this.textureKey);
            if (!this._sprite) {
                console.error('[SpriteComponent] 精灵创建失败');
                return;
            }

            console.log('[SpriteComponent] 设置精灵属性');
            this._sprite.setCollideWorldBounds(true);
            this._sprite.setSize(32, 32);
            this._sprite.setDisplaySize(32, 32);
            console.log('[SpriteComponent] 精灵初始化完成');
        } catch (error) {
            console.error('[SpriteComponent] 精灵初始化错误:', error);
        }
    }

    get sprite(): Phaser.Physics.Arcade.Sprite {
        if (!this._sprite) {
            console.error('[SpriteComponent] 尝试访问未初始化的精灵');
            throw new Error('Sprite not initialized');
        }
        return this._sprite;
    }

    setVisible(visible: boolean): void {
        console.log(`[SpriteComponent] 设置可见性: ${visible}`);
        this.visible = visible;
        if (this._sprite) {
            this._sprite.setVisible(visible);
        } else {
            console.warn('[SpriteComponent] 无法设置可见性: 精灵未初始化');
        }
    }

    setAlpha(alpha: number): void {
        console.log(`[SpriteComponent] 设置透明度: ${alpha}`);
        this.alpha = alpha;
        if (this._sprite) {
            this._sprite.setAlpha(alpha);
        } else {
            console.warn('[SpriteComponent] 无法设置透明度: 精灵未初始化');
        }
    }

    setSize(width: number, height: number): void {
        console.log(`[SpriteComponent] 设置大小: ${width}x${height}`);
        if (!this._sprite) {
            console.warn('[SpriteComponent] 无法设置大小: 精灵未初始化');
            return;
        }
        try {
            this._sprite.setSize(width, height);
            this._sprite.setDisplaySize(width, height);
            console.log('[SpriteComponent] 大小设置成功');
        } catch (error) {
            console.error('[SpriteComponent] 设置大小失败:', error);
        }
    }

    setDepth(depth: number): void {
        console.log(`[SpriteComponent] 设置深度: ${depth}`);
        if (this._sprite) {
            this._sprite.setDepth(depth);
        } else {
            console.warn('[SpriteComponent] 无法设置深度: 精灵未初始化');
        }
    }

    destroy(): void {
        console.log('[SpriteComponent] 销毁精灵');
        if (this._sprite) {
            this._sprite.destroy();
            this._sprite = null;
            console.log('[SpriteComponent] 精灵已销毁');
        } else {
            console.warn('[SpriteComponent] 尝试销毁未初始化的精灵');
        }
    }
} 