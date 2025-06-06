/**
 * 游戏日志工具类
 */
export class Logger {
    private static instance: Logger;
    private logs: string[] = [];
    private readonly MAX_LOGS = 100;
    private readonly LOG_STYLES = {
        Scene: 'color: #4CAF50',
        Wave: 'color: #2196F3',
        StateChange: 'color: #9C27B0',
        Event: 'color: #FF9800',
        Timer: 'color: #795548',
        Score: 'color: #F44336',
        Game: 'color: #E91E63',
        Debug: 'color: #607D8B'
    };

    private constructor() {
        console.log('%c游戏日志系统初始化', 'color: #4CAF50; font-weight: bold');
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * 记录日志
     * @param category 日志类别
     * @param message 日志信息
     */
    log(category: string, message: string): void {
        const timestamp = new Date().toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const logMessage = `[${timestamp}] [${category}] ${message}`;
        
        // 使用不同颜色输出不同类型的日志
        const style = this.LOG_STYLES[category as keyof typeof this.LOG_STYLES] || 'color: #666666';
        console.log(`%c${logMessage}`, style);
        
        this.logs.push(logMessage);
        if (this.logs.length > this.MAX_LOGS) {
            this.logs.shift();
        }
    }

    /**
     * 获取所有日志
     */
    getLogs(): string[] {
        return [...this.logs];
    }

    /**
     * 清除所有日志
     */
    clear(): void {
        this.logs = [];
        console.clear();
        console.log('%c游戏日志已清除', 'color: #4CAF50; font-weight: bold');
    }
}
