export class UI {
  constructor(ctx, canvasW, canvasH) {
    this.ctx = ctx;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
  }

  render(score, lives, level, highScore) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#fff';

    // 得分
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 12, 24);

    // 关卡
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level}`, this.canvasW / 2, 24);

    // 生命值（心形图标）
    ctx.textAlign = 'right';
    const hearts = '♥'.repeat(lives) + '♡'.repeat(Math.max(0, 3 - lives));
    ctx.fillStyle = '#f55';
    ctx.fillText(hearts, this.canvasW - 12, 24);

    // 最高分（右下角小字）
    if (highScore > 0) {
      ctx.font = '12px monospace';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'right';
      ctx.fillText(`BEST: ${highScore}`, this.canvasW - 12, this.canvasH - 10);
    }

    ctx.restore();
  }

  renderGameOver(score, highScore) {
    const ctx = this.ctx;
    ctx.save();

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    ctx.textAlign = 'center';

    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#f44';
    ctx.fillText('GAME OVER', this.canvasW / 2, this.canvasH / 2 - 50);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`最终得分: ${score}`, this.canvasW / 2, this.canvasH / 2);

    if (highScore > 0) {
      ctx.font = '18px monospace';
      ctx.fillStyle = '#ff0';
      ctx.fillText(`最高分: ${highScore}`, this.canvasW / 2, this.canvasH / 2 + 34);
    }

    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('刷新页面重新开始', this.canvasW / 2, this.canvasH / 2 + 68);

    ctx.restore();
  }

  renderLevelComplete(level) {
    const ctx = this.ctx;
    ctx.save();

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    ctx.textAlign = 'center';

    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#4f4';
    ctx.fillText(`第 ${level} 关完成！`, this.canvasW / 2, this.canvasH / 2 - 40);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`准备进入第 ${level + 1} 关`, this.canvasW / 2, this.canvasH / 2 + 10);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('按 Enter 或 Space 继续', this.canvasW / 2, this.canvasH / 2 + 50);

    ctx.restore();
  }

  // 临时提示（存档恢复等）
  renderToast(message, alpha) {
    if (alpha <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const tw = ctx.measureText(message).width + 24;
    ctx.fillRect(this.canvasW / 2 - tw / 2, this.canvasH - 60, tw, 28);
    ctx.fillStyle = '#4f4';
    ctx.fillText(message, this.canvasW / 2, this.canvasH - 41);
    ctx.restore();
  }
}
