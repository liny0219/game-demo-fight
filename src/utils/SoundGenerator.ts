import * as fs from 'fs';
import * as path from 'path';

/**
 * 音效生成器工具类
 */
export class SoundGenerator {
    /**
     * 生成简单的WAV音频数据
     */
    private static generateWavData(frequency: number, duration: number, volume: number = 0.5): Buffer {
        const sampleRate = 44100;
        const numSamples = Math.floor(sampleRate * duration);
        
        // WAV文件头 (44字节)
        const header = Buffer.alloc(44);
        
        // RIFF chunk descriptor
        header.write('RIFF', 0);
        header.writeUInt32LE(36 + numSamples * 2, 4);
        header.write('WAVE', 8);
        
        // fmt sub-chunk
        header.write('fmt ', 12);
        header.writeUInt32LE(16, 16);
        header.writeUInt16LE(1, 20);
        header.writeUInt16LE(1, 22);
        header.writeUInt32LE(sampleRate, 24);
        header.writeUInt32LE(sampleRate * 2, 28);
        header.writeUInt16LE(2, 32);
        header.writeUInt16LE(16, 34);
        
        // data sub-chunk
        header.write('data', 36);
        header.writeUInt32LE(numSamples * 2, 40);
        
        // 音频数据
        const data = Buffer.alloc(numSamples * 2);
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const sample = Math.sin(2 * Math.PI * frequency * t) * volume;
            const value = Math.floor(sample * 32767);
            data.writeInt16LE(value, i * 2);
        }
        
        return Buffer.concat([header, data]);
    }

    /**
     * 生成波次开始音效
     */
    private static generateWaveStartSound(): Buffer {
        // 生成上升音调（从220Hz到880Hz）
        const duration = 0.5;
        const sampleRate = 44100;
        const numSamples = Math.floor(sampleRate * duration);
        
        const header = Buffer.alloc(44);
        // WAV文件头设置（同上）
        header.write('RIFF', 0);
        header.writeUInt32LE(36 + numSamples * 2, 4);
        header.write('WAVE', 8);
        header.write('fmt ', 12);
        header.writeUInt32LE(16, 16);
        header.writeUInt16LE(1, 20);
        header.writeUInt16LE(1, 22);
        header.writeUInt32LE(sampleRate, 24);
        header.writeUInt32LE(sampleRate * 2, 28);
        header.writeUInt16LE(2, 32);
        header.writeUInt16LE(16, 34);
        header.write('data', 36);
        header.writeUInt32LE(numSamples * 2, 40);
        
        const data = Buffer.alloc(numSamples * 2);
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const frequency = 220 + (880 - 220) * (t / duration);
            const amplitude = Math.pow(1 - t / duration, 2);
            const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
            const value = Math.floor(sample * 32767);
            data.writeInt16LE(value, i * 2);
        }
        
        return Buffer.concat([header, data]);
    }

    /**
     * 生成倒计时音效
     */
    private static generateCountdownSound(): Buffer {
        return this.generateWavData(440, 0.2, 0.3);
    }

    /**
     * 生成音效文件
     */
    static async generateSoundFiles(): Promise<void> {
        const soundsDir = path.join(process.cwd(), 'assets', 'sounds');
        
        // 确保目录存在
        if (!fs.existsSync(soundsDir)) {
            fs.mkdirSync(soundsDir, { recursive: true });
        }
        
        // 生成波次开始音效
        const waveStartSound = this.generateWaveStartSound();
        fs.writeFileSync(path.join(soundsDir, 'wave_start.wav'), waveStartSound);
        
        // 生成倒计时音效
        const countdownSound = this.generateCountdownSound();
        fs.writeFileSync(path.join(soundsDir, 'countdown.wav'), countdownSound);
    }
}
