import { Scene } from 'phaser';

export class Debug {
    private static instance: Debug;
    private scene?: Scene;
    private debugText?: Phaser.GameObjects.Text;
    private lastEvent: string = '';
    private debugInfo: { [key: string]: any } = {};
    private enabled: boolean = false;

    private constructor() {
        console.log('%c调试系统初始化', 'color: #607D8B; font-weight: bold');
    }

    public static getInstance(): Debug {
        if (!Debug.instance) {
            Debug.instance = new Debug();
        }
        return Debug.instance;
    }

    public init(scene: Scene): void {
        this.scene = scene;
        this.clear();
        this.createDebugText();
        this.logEvent('Debug', '调试显示已初始化');
    }

    private createDebugText(): void {
        if (!this.scene) return;

        // 清理旧的文本对象
        if (this.debugText) {
            this.debugText.destroy();
            this.debugText = undefined;
        }

        // 创建新的文本对象，放在右下角
        this.debugText = this.scene.add.text(
            this.scene.cameras.main.width - 10,
            this.scene.cameras.main.height - 120,
            '',
            {
                fontSize: '16px',
                color: '#00ff00',
                backgroundColor: '#00000066',
                padding: { x: 10, y: 10 }
            }
        ).setOrigin(1, 1).setDepth(1000);
        
        // 默认隐藏
        this.debugText.setVisible(this.enabled);
        this.updateDisplay();
    }

    public clear(): void {
        this.debugInfo = {};
        this.lastEvent = '';
        this.updateDisplay();
    }

    public set(key: string, value: any): void {
        if (!this.enabled) return;

        const oldValue = this.debugInfo[key];
        this.debugInfo[key] = value;

        if (oldValue !== value) {
            this.logEvent('Debug', `${key}: ${oldValue} -> ${value}`);
        }

        this.updateDisplay();
    }

    public logEvent(category: string, event: string, data?: any): void {
        if (!this.enabled) return;

        const time = new Date().toLocaleTimeString();
        const dataStr = data ? ` - ${JSON.stringify(data)}` : '';
        console.log(`%c[${time}] [Event] [${category}] ${event}${dataStr}`, 'color: #FF9800');

        const lastEventStr = `${category}: ${event}`;
        if (this.lastEvent) {
            console.log(`%c[${time}] [Debug] lastEvent: ${this.lastEvent} -> ${lastEventStr}`, 'color: #607D8B');
        }
        this.lastEvent = lastEventStr;

        this.updateDisplay();
    }

    private updateDisplay(): void {
        if (!this.enabled || !this.debugText || !this.scene) return;

        try {
            const debugLines = [
                `lastEvent: "${this.lastEvent}"`,
                ...Object.entries(this.debugInfo).map(([key, value]) => `${key}: ${value}`)
            ];

            this.debugText.setText(debugLines.join('\n'));
        } catch (error) {
            console.error('Debug display update error:', error);
        }
    }

    public enable(): void {
        this.enabled = true;
        if (this.debugText) {
            this.debugText.setVisible(true);
        }
        this.updateDisplay();
    }

    public disable(): void {
        this.enabled = false;
        if (this.debugText) {
            this.debugText.setVisible(false);
        }
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public destroy(): void {
        if (this.debugText) {
            this.debugText.destroy();
            this.debugText = undefined;
        }
        this.scene = undefined;
        this.clear();
    }
}
