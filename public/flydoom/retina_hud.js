// FlyDoom compound-eye HUD
//
// Retinotopic geometry is expected in the `columns.json` format used by
// ZeroXClem/closed-loop-fly, derived from AbijahKaj/fruit-fly-brain-research
// and MaleCNS v1.0. See RETINA-PROVENANCE.md for attribution and licensing.

export class CompoundEyeHUD {
  constructor(canvas, columns, options = {}) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError("CompoundEyeHUD requires a canvas element");
    }
    if (!columns || columns.count !== 1771 || !columns.az || !columns.el || !columns.side) {
      throw new TypeError("Expected MaleCNS retinotopic columns.json (count=1771)");
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.columns = columns;
    this.fov = options.fov ?? Math.PI * 0.8; // 144 degrees, matching FlyAgent.sense()
    this.channels = options.channels ?? 32;
    this.pointRadius = options.pointRadius ?? 2.1;
    this.halfFov = this.fov / 2;

    this.channelMap = new Int8Array(columns.count);
    this.screenX = new Float32Array(columns.count);
    this.screenY = new Float32Array(columns.count);
    this.visible = new Uint8Array(columns.count);

    this._precompute();
  }

  _precompute() {
    const { columns, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;

    // Equirectangular retinotopic projection. The data itself remains in the
    // upstream azimuth/elevation coordinate frame; only screen coordinates are projected.
    let minEl = Infinity;
    let maxEl = -Infinity;
    for (let i = 0; i < columns.count; i++) {
      minEl = Math.min(minEl, columns.el[i]);
      maxEl = Math.max(maxEl, columns.el[i]);
    }
    const elSpan = Math.max(1e-6, maxEl - minEl);

    for (let i = 0; i < columns.count; i++) {
      const az = columns.az[i];
      if (az < -this.halfFov || az > this.halfFov) {
        this.channelMap[i] = -1;
        this.visible[i] = 0;
        continue;
      }

      const normAz = (az + this.halfFov) / this.fov;
      this.channelMap[i] = Math.min(
        this.channels - 1,
        Math.max(0, Math.floor(normAz * this.channels)),
      );
      this.visible[i] = 1;
      this.screenX[i] = normAz * width;
      this.screenY[i] = height - ((columns.el[i] - minEl) / elSpan) * height;
    }
  }

  render(wallDists, prizeDists) {
    if (!wallDists || wallDists.length !== this.channels) return;
    if (!prizeDists || prizeDists.length !== this.channels) return;

    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#05080c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const stim = new Float32Array(this.channels);
    for (let k = 0; k < this.channels; k++) {
      const prox = Math.max(0, 1 - wallDists[k] / 4);
      stim[k] = prox * 2 + prizeDists[k] * 2.5;
    }

    // Biologically grounded sampling geometry, current-model drive painted onto it.
    for (let i = 0; i < this.columns.count; i++) {
      if (!this.visible[i]) continue;
      const k = this.channelMap[i];
      const drive = Math.min(1, stim[k] / 4.5);
      const leftEye = this.columns.side[i] === 0;

      const base = 26 + Math.round(drive * 180);
      const r = leftEye ? Math.round(base * 0.55) : Math.round(base * 0.35);
      const g = Math.round(base * 0.85);
      const b = leftEye ? base : Math.min(255, base + 35);

      ctx.beginPath();
      ctx.arc(this.screenX[i], this.screenY[i], this.pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.24 + drive * 0.76})`;
      ctx.fill();
    }

    this._drawEncoderOverlay(stim);
  }

  _drawEncoderOverlay(stim) {
    const { ctx, canvas } = this;
    const step = canvas.width / this.channels;

    ctx.save();
    ctx.lineWidth = 1;
    for (let k = 0; k <= this.channels; k++) {
      const x = k * step;
      ctx.strokeStyle = k === 16 ? "rgba(255,255,255,0.55)" : "rgba(88,166,255,0.16)";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Current model drive: 16 left VPL channels, 16 right VPR channels.
    for (let k = 0; k < this.channels; k++) {
      const drive = Math.min(1, stim[k] / 4.5);
      if (drive <= 0.01) continue;
      ctx.fillStyle = `rgba(0,240,255,${0.04 + drive * 0.14})`;
      ctx.fillRect(k * step, 0, step, canvas.height);
    }

    ctx.font = "11px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText("VPL · channels 0–15", 8, 16);
    const rightLabel = "VPR · channels 16–31";
    const labelWidth = ctx.measureText(rightLabel).width;
    ctx.fillText(rightLabel, canvas.width - labelWidth - 8, 16);
    ctx.restore();
  }

  inspect(clientX, clientY, wallDists, prizeDists) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.canvas.width;
    const channel = Math.min(
      this.channels - 1,
      Math.max(0, Math.floor((x / this.canvas.width) * this.channels)),
    );
    const prox = Math.max(0, 1 - wallDists[channel] / 4);
    const prize = prizeDists[channel] ?? 0;
    const drive = prox * 2 + prize * 2.5;
    const local = channel < 16 ? channel : channel - 16;
    return {
      channel,
      side: channel < 16 ? "left" : "right",
      target: channel < 16 ? `ray_vpl[${local}]` : `ray_vpr[${local}]`,
      wallDistance: wallDists[channel],
      wallProximity: prox,
      prizeVisibility: prize,
      stim: drive,
      canvasY: ((clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }
}
