import { Component } from '../ecs/Component';

export class HealthComponent extends Component {
    public currentHealth: number;
    public maxHealth: number;
    public isInvincible: boolean = false;
    public invincibleTime: number = 0;
    public isDead: boolean = false;

    constructor(maxHealth: number) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }

    takeDamage(amount: number, ignoreInvincible: boolean = false): boolean {
        if (!ignoreInvincible && (this.isInvincible || this.isDead)) {
            return false;
        }

        if (this.isDead) {
            return false;
        }

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        if (this.currentHealth <= 0) {
            this.isDead = true;
        }

        return true;
    }

    heal(amount: number): void {
        if (this.isDead) return;
        
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    setInvincible(duration: number): void {
        this.isInvincible = true;
        this.invincibleTime = duration;
    }

    update(deltaTime: number): void {
        if (this.isInvincible && this.invincibleTime > 0) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.isInvincible = false;
                this.invincibleTime = 0;
                console.log('无敌时间结束');
            }
        }
    }

    getHealthPercentage(): number {
        return this.currentHealth / this.maxHealth;
    }

    isAlive(): boolean {
        return !this.isDead;
    }
} 