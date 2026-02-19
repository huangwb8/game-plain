// Web Audio API 程序化音效系统（无需外部音频文件）
export class SoundManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this.enabled = true;
    this.volume = 0.8; // 0~1
  }

  // 主动解锁 AudioContext（在用户交互事件中调用）
  unlock() {
    const ctx = this._getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this.volume;
      this._masterGain.connect(this._ctx.destination);
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  _dest() {
    this._getCtx();
    return this._masterGain;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this._masterGain) this._masterGain.gain.value = this.volume;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this._masterGain) {
      this._masterGain.gain.value = this.enabled ? this.volume : 0;
    }
    return this.enabled;
  }

  _play(fn) {
    if (!this.enabled) return;
    const ctx = this._getCtx();
    const dest = this._masterGain;
    const doPlay = () => { try { fn(ctx, dest); } catch (_) {} };
    // resume() 是异步的，必须等它完成后再播放，否则首次加载时声音会被丢弃
    if (ctx.state === 'running') {
      doPlay();
    } else {
      ctx.resume().then(doPlay).catch(() => {});
    }
  }

  // 射击音效：短促高频脉冲
  shoot() {
    this._play((ctx, dest) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(dest);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    });
  }

  // 敌机爆炸：白噪声衰减
  explosion() {
    this._play((ctx, dest) => {
      const bufLen = Math.floor(ctx.sampleRate * 0.18);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      src.connect(gain);
      gain.connect(dest);
      src.start(ctx.currentTime);
    });
  }

  // 玩家受击：低频下滑锯齿波
  playerHit() {
    this._play((ctx, dest) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(dest);
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    });
  }

  // 通关音效：上行和弦
  levelUp() {
    this._play((ctx, dest) => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(dest);
        const t = ctx.currentTime + i * 0.13;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    });
  }

  // 游戏结束：下行悲鸣
  gameOver() {
    this._play((ctx, dest) => {
      [392, 330, 262].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(dest);
        const t = ctx.currentTime + i * 0.22;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    });
  }

  // Buff 拾取：上扬双音
  buffPickup() {
    this._play((ctx, dest) => {
      [660, 990].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(dest);
        const t = ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    });
  }
}
