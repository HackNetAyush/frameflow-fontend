/**
 * Paint operation executor.
 *
 * Layout produces a flat list of ops in absolute frame coordinates; this walks
 * that list and draws it. Keeping paint dumb and separate is what allows the
 * same op list to be measured, re-fitted, clipped for a progressive reveal, or
 * drawn at a different device scale without re-running layout.
 */

const roundRectPath = (ctx, x, y, w, h, r) => {
  const radius = Math.max(0, Math.min(r || 0, Math.abs(w) / 2, Math.abs(h) / 2));
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const applyStroke = (ctx, op) => {
  ctx.strokeStyle = op.stroke;
  ctx.lineWidth = op.lw || 1;
  ctx.lineCap = op.cap || 'butt';
  ctx.lineJoin = op.join || 'miter';
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} ops
 * @param {object} [opts] `{ alpha, offsetY, clip: {x,y,w,h} }`
 */
export function paintOps(ctx, ops, opts = {}) {
  const { alpha = 1, offsetY = 0, clip } = opts;
  if (alpha <= 0.001) return;

  ctx.save();
  if (clip) {
    ctx.beginPath();
    ctx.rect(clip.x, clip.y, clip.w, clip.h);
    ctx.clip();
  }
  if (offsetY) ctx.translate(0, offsetY);
  if (alpha < 1) ctx.globalAlpha = alpha;

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  for (const op of ops) {
    switch (op.k) {
      case 'text': {
        ctx.font = op.font;
        ctx.fillStyle = op.fill;
        if (op.scaleY && op.scaleY !== 1) {
          // Used for delimiters that must stretch around a tall body.
          const oy = op.originY ?? op.y;
          ctx.save();
          ctx.translate(op.x, oy);
          ctx.scale(op.scaleX || 1, op.scaleY);
          ctx.fillText(op.text, 0, (op.y - oy) / op.scaleY);
          ctx.restore();
        } else {
          ctx.fillText(op.text, op.x, op.y);
        }
        break;
      }

      case 'rect': {
        if (op.r) roundRectPath(ctx, op.x, op.y, op.w, op.h, op.r);
        else { ctx.beginPath(); ctx.rect(op.x, op.y, op.w, op.h); }
        if (op.fill) { ctx.fillStyle = op.fill; ctx.fill(); }
        if (op.stroke) { applyStroke(ctx, op); ctx.stroke(); }
        break;
      }

      case 'dot': {
        ctx.beginPath();
        ctx.arc(op.x, op.y, op.r, 0, Math.PI * 2);
        if (op.fill) { ctx.fillStyle = op.fill; ctx.fill(); }
        if (op.stroke) { applyStroke(ctx, op); ctx.stroke(); }
        break;
      }

      case 'path': {
        if (!op.points?.length) break;
        ctx.beginPath();
        op.points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        if (op.close) ctx.closePath();
        if (op.fill) { ctx.fillStyle = op.fill; ctx.fill(); }
        if (op.stroke) { applyStroke(ctx, op); ctx.stroke(); }
        break;
      }

      case 'curve': {
        ctx.beginPath();
        ctx.moveTo(op.x, op.y);
        ctx.quadraticCurveTo(op.cx, op.cy, op.ex, op.ey);
        applyStroke(ctx, op);
        ctx.stroke();
        break;
      }

      case 'image': {
        if (!op.img) break;
        ctx.save();
        if (op.r) { roundRectPath(ctx, op.x, op.y, op.w, op.h, op.r); ctx.clip(); }
        try {
          ctx.drawImage(op.img, op.x, op.y, op.w, op.h);
        } catch {
          /* A tainted or broken bitmap must not abort the whole frame. */
        }
        ctx.restore();
        if (op.stroke) {
          roundRectPath(ctx, op.x, op.y, op.w, op.h, op.r || 0);
          applyStroke(ctx, op);
          ctx.stroke();
        }
        break;
      }

      case 'linearGradient': {
        const g = ctx.createLinearGradient(op.x, op.y, op.x2 ?? op.x, op.y2 ?? op.y + op.h);
        (op.stops || []).forEach(([stop, color]) => g.addColorStop(stop, color));
        ctx.fillStyle = g;
        if (op.r) roundRectPath(ctx, op.x, op.y, op.w, op.h, op.r);
        else { ctx.beginPath(); ctx.rect(op.x, op.y, op.w, op.h); }
        ctx.fill();
        break;
      }

      default:
        break;
    }
  }

  ctx.restore();
}
