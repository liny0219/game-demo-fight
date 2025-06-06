import { Component } from '../ecs/Component';

export class VelocityComponent extends Component {
    public vx: number;
    public vy: number;
    public maxSpeed: number;
    public friction: number;

    constructor(vx: number = 0, vy: number = 0, maxSpeed: number = 1000, friction: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
        this.maxSpeed = maxSpeed;
        this.friction = friction;
    }

    setVelocity(vx: number, vy: number): void {
        this.vx = vx;
        this.vy = vy;
        this.limitSpeed();
    }

    addVelocity(dvx: number, dvy: number): void {
        this.vx += dvx;
        this.vy += dvy;
        this.limitSpeed();
    }

    private limitSpeed(): void {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
    }

    applyFriction(deltaTime: number): void {
        if (this.friction > 0) {
            const frictionAmount = this.friction * deltaTime / 1000;
            this.vx *= Math.max(0, 1 - frictionAmount);
            this.vy *= Math.max(0, 1 - frictionAmount);
        }
    }

    getSpeed(): number {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
} 