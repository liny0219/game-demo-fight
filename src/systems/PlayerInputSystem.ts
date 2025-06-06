import 'phaser';
import { System } from '../ecs/System';
import { PlayerComponent } from '../components/PlayerComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { TransformComponent } from '../components/TransformComponent';
import { SpriteComponent } from '../components/SpriteComponent';

export class PlayerInputSystem extends System {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private touchStartTime: number = 0;
    private touchStartPosition: { x: number; y: number } | null = null;

    constructor(world: any, scene: Phaser.Scene) {
        super(world);
        this.setupControls(scene);
    }

    private setupControls(scene: Phaser.Scene): void {
        // 键盘控制
        this.cursors = scene.input.keyboard?.createCursorKeys();

        // 触摸控制
        scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.touchStartTime = scene.time.now;
            this.touchStartPosition = { x: pointer.x, y: pointer.y };
            this.handleAttack(pointer, scene);
        });

        scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            const touchDuration = scene.time.now - this.touchStartTime;
            
            if (this.touchStartPosition) {
                const distance = Phaser.Math.Distance.Between(
                    this.touchStartPosition.x,
                    this.touchStartPosition.y,
                    pointer.x,
                    pointer.y
                );

                // 长按释放技能
                if (touchDuration > 500 && distance < 10) {
                    this.handleSkill();
                }
            }

            this.touchStartPosition = null;
            this.stopMovement();
        });

        scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown && this.touchStartPosition) {
                this.handleTouchMovement(pointer);
            }
        });

        // 键盘技能控制
        scene.input.keyboard?.on('keydown-SPACE', () => this.handleAttack(null, scene));
        scene.input.keyboard?.on('keydown-SHIFT', () => this.handleSkill());
    }

    update(deltaTime: number): void {
        const playerEntities = this.getEntitiesWith(PlayerComponent, VelocityComponent, TransformComponent);

        for (const entity of playerEntities) {
            const player = entity.getComponent(PlayerComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;

            // 处理键盘移动
            this.handleKeyboardMovement(player, velocity);
        }
    }

    private handleKeyboardMovement(player: PlayerComponent, velocity: VelocityComponent): void {
        if (!this.cursors) return;

        const moveX = (this.cursors.left.isDown ? -1 : 0) + (this.cursors.right.isDown ? 1 : 0);
        const moveY = (this.cursors.up.isDown ? -1 : 0) + (this.cursors.down.isDown ? 1 : 0);
        
        if (moveX !== 0 || moveY !== 0) {
            // 更新最后移动方向
            player.lastMoveDirection = { x: moveX, y: moveY };

            // 标准化向量以保持对角线移动速度一致
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            velocity.setVelocity(
                (moveX / length) * player.movementSpeed,
                (moveY / length) * player.movementSpeed
            );
        } else if (!this.touchStartPosition) {
            velocity.setVelocity(0, 0);
        }
    }

    private handleTouchMovement(pointer: Phaser.Input.Pointer): void {
        if (!this.touchStartPosition) return;

        const playerEntities = this.getEntitiesWith(PlayerComponent, VelocityComponent, TransformComponent);
        
        for (const entity of playerEntities) {
            const player = entity.getComponent(PlayerComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;
            const transform = entity.getComponent(TransformComponent)!;

            const distance = Phaser.Math.Distance.Between(
                this.touchStartPosition.x,
                this.touchStartPosition.y,
                pointer.x,
                pointer.y
            );

            if (distance > 10) {
                const angle = Phaser.Math.Angle.Between(
                    transform.x,
                    transform.y,
                    pointer.x,
                    pointer.y
                );

                const moveX = Math.cos(angle);
                const moveY = Math.sin(angle);
                player.lastMoveDirection = { x: moveX, y: moveY };

                velocity.setVelocity(
                    moveX * player.movementSpeed,
                    moveY * player.movementSpeed
                );
            }
        }
    }

    private handleAttack(pointer: Phaser.Input.Pointer | null, scene: Phaser.Scene): void {
        const playerEntities = this.getEntitiesWith(PlayerComponent, TransformComponent);
        
        for (const entity of playerEntities) {
            const player = entity.getComponent(PlayerComponent)!;
            const transform = entity.getComponent(TransformComponent)!;

            if (pointer) {
                // 更新攻击方向
                const angle = Phaser.Math.Angle.Between(
                    transform.x, transform.y,
                    pointer.x, pointer.y
                );
                player.lastMoveDirection = {
                    x: Math.cos(angle),
                    y: Math.sin(angle)
                };
            }

            // 触发攻击事件
            scene.events.emit('player-attack', entity);
        }
    }

    private handleSkill(): void {
        const playerEntities = this.getEntitiesWith(PlayerComponent);
        
        for (const entity of playerEntities) {
            const player = entity.getComponent(PlayerComponent)!;
            
            if (player.useSkill()) {
                // 触发技能事件
                entity.getScene().events.emit('player-skill', entity);
            }
        }
    }

    private stopMovement(): void {
        const playerEntities = this.getEntitiesWith(PlayerComponent, VelocityComponent);
        
        for (const entity of playerEntities) {
            const velocity = entity.getComponent(VelocityComponent)!;
            velocity.setVelocity(0, 0);
        }
    }
} 