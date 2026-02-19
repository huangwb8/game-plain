export class UI {
  constructor(ctx, canvasW, canvasH) {
    this.ctx = ctx;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
  }

  render(score, lives, level) {
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

    ctx.restore();
  }

  renderGameOver(score) {
    const ctx = this.ctx;
    ctx.save();

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    ctx.textAlign = 'center';

    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#f44';
    ctx.fillText('GAME OVER', this.canvasW / 2, this.canvasH / 2 - 40);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`最终得分: ${score}`, this.canvasW / 2, this.canvasH / 2 + 10);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('刷新页面重新开始', this.canvasW / 2, this.canvasH / 2 + 50);

    ctx.restore();
  }
}

