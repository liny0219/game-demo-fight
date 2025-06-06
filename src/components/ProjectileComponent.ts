import { Component } from '../ecs/Component';

export class ProjectileComponent extends Component {
    public damage: number;
    public lifetime: number;
    public maxLifetime: number;

    constructor(damage: number = 30, maxLifetime: number = 3000) {
        super();
        this.damage = damage;
        this.lifetime = 0;
        this.maxLifetime = maxLifetime;
    }

    update(deltaTime: number): void {
        this.lifetime += deltaTime;
    }

    isExpired(): boolean {
        return this.lifetime >= this.maxLifetime;
    }
} 