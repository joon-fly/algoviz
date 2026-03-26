// ── Data Structure Renderers ─────────────────────────────────────

const C = {
  bg:      '#13131a',
  surface: '#2a2845',
  border:  '#1e1e2e',
  text:    '#0a0a0f',
  muted:   '#5a5880',
  active:  '#f76a8c',
  new:     '#7c6af7',
  found:   '#6af7c8',
  removed: '#f76a8c',
  faded:   '#3a3060',
  arrow:   '#5a5880',
  arrowHL: '#7c6af7',
  label:   '#e2e0ff',
  dimLabel:'#5a5880',
};

function drawRoundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

function label(ctx, text, x, y, color = C.label, size = 11, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Space Mono", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// ── STACK renderer ───────────────────────────────────────────────
export function drawStack(ctx, W, H, snapshot) {
  ctx.clearRect(0, 0, W, H);
  if (!snapshot) return;

  const { items, highlights, pointerLabel } = snapshot;
  const BOX_W = Math.min(160, W * 0.3);
  const BOX_H = 48;
  const GAP   = 6;
  const MAX_VISIBLE = Math.floor((H - 120) / (BOX_H + GAP));
  const cx    = W / 2;
  const baseY = H - 60;

  // Base platform
  ctx.beginPath();
  ctx.moveTo(cx - BOX_W / 2 - 10, baseY + 6);
  ctx.lineTo(cx + BOX_W / 2 + 10, baseY + 6);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Stack label
  label(ctx, 'STACK', cx, baseY + 24, C.muted, 10);

  // Overflow indicator
  const overflow = items.length > MAX_VISIBLE;
  const visible  = overflow ? items.slice(items.length - MAX_VISIBLE) : items;
  const startIdx = overflow ? items.length - MAX_VISIBLE : 0;

  if (overflow) {
    label(ctx, `▲ +${items.length - MAX_VISIBLE} more`, cx, baseY - MAX_VISIBLE * (BOX_H + GAP) - 24, C.muted, 9);
  }

  visible.forEach((val, vi) => {
    const realIdx = startIdx + vi;
    const y = baseY - (vi + 1) * (BOX_H + GAP);
    const hk = highlights[realIdx];
    const fill = hk === 'new'     ? C.new
               : hk === 'active'  ? C.active
               : hk === 'found'   ? C.found
               : hk === 'removed' ? C.removed
               : C.surface;
    const stroke = hk ? fill : C.border;

    // Glow
    if (hk && hk !== 'muted') {
      ctx.shadowColor = fill;
      ctx.shadowBlur  = 12;
    }

    drawRoundRect(ctx, cx - BOX_W / 2, y, BOX_W, BOX_H, 6, fill, stroke);
    ctx.shadowBlur = 0;

    label(ctx, String(val), cx, y + BOX_H / 2, hk ? '#fff' : C.label, 14);

    // Index label
    label(ctx, `[${realIdx}]`, cx - BOX_W / 2 - 28, y + BOX_H / 2, C.muted, 9, 'right');
  });

  // top pointer
  if (pointerLabel) {
    const topY = baseY - visible.length * (BOX_H + GAP) - BOX_H / 2;
    ctx.beginPath();
    ctx.moveTo(cx + BOX_W / 2 + 6, topY);
    ctx.lineTo(cx + BOX_W / 2 + 36, topY);
    ctx.strokeStyle = C.arrowHL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    label(ctx, pointerLabel, cx + BOX_W / 2 + 40, topY, C.arrowHL, 9, 'left');
  }

  // Empty state
  if (items.length === 0) {
    label(ctx, '(비어있음)', cx, H / 2, C.muted, 11);
  }
}

// ── QUEUE renderer ───────────────────────────────────────────────
export function drawQueue(ctx, W, H, snapshot) {
  ctx.clearRect(0, 0, W, H);
  if (!snapshot) return;

  const { items, highlights, frontLabel, rearLabel } = snapshot;
  const BOX_W = Math.min(72, (W - 120) / Math.max(items.length, 5));
  const BOX_H = 52;
  const GAP   = 8;
  const cy    = H / 2;
  const totalW = items.length * (BOX_W + GAP) - GAP;
  const startX = (W - totalW) / 2;

  // Queue label
  label(ctx, 'QUEUE', W / 2, H - 30, C.muted, 10);

  // Walls
  const wallH = BOX_H + 24;
  const wallY = cy - wallH / 2;
  [[startX - 18, true], [startX + totalW + 4, false]].forEach(([x, isLeft]) => {
    ctx.beginPath();
    ctx.moveTo(x, wallY);
    ctx.lineTo(x, wallY + wallH);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Arrow direction
    const arrowX = isLeft ? x - 20 : x + 20;
    ctx.beginPath();
    ctx.moveTo(isLeft ? x + 4 : x - 4, cy);
    ctx.lineTo(arrowX, cy);
    ctx.strokeStyle = C.arrowHL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    label(ctx, isLeft ? '← dequeue' : 'enqueue →', arrowX + (isLeft ? -28 : 28), cy, C.arrowHL, 8, 'center');
  });

  if (items.length === 0) {
    label(ctx, '(비어있음)', W / 2, cy, C.muted, 11);
    return;
  }

  items.forEach((val, i) => {
    const x   = startX + i * (BOX_W + GAP);
    const hk  = highlights[i];
    const fill = hk === 'new'    ? C.new
               : hk === 'active' ? C.active
               : hk === 'found'  ? C.found
               : C.surface;
    const stroke = hk ? fill : C.border;

    if (hk && hk !== 'muted') {
      ctx.shadowColor = fill; ctx.shadowBlur = 12;
    }
    drawRoundRect(ctx, x, cy - BOX_H / 2, BOX_W, BOX_H, 6, fill, stroke);
    ctx.shadowBlur = 0;

    label(ctx, String(val), x + BOX_W / 2, cy, hk ? '#fff' : C.label, 13);

    // Arrow to next
    if (i < items.length - 1) {
      ctx.beginPath();
      ctx.moveTo(x + BOX_W + 2, cy);
      ctx.lineTo(x + BOX_W + GAP - 2, cy);
      ctx.strokeStyle = C.arrow;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // front/rear labels
  if (frontLabel) {
    const fx = startX + BOX_W / 2;
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(fx, cy + BOX_H / 2 + 2);
    ctx.lineTo(fx, cy + BOX_H / 2 + 18);
    ctx.strokeStyle = C.found; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, 'front', fx, cy + BOX_H / 2 + 26, C.found, 9);
  }

  if (rearLabel && items.length > 0) {
    const rx = startX + (items.length - 1) * (BOX_W + GAP) + BOX_W / 2;
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(rx, cy - BOX_H / 2 - 2);
    ctx.lineTo(rx, cy - BOX_H / 2 - 18);
    ctx.strokeStyle = C.active; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, 'rear', rx, cy - BOX_H / 2 - 28, C.active, 9);
  }
}

// ── LINKED LIST renderer ─────────────────────────────────────────
export function drawLinkedList(ctx, W, H, snapshot) {
  ctx.clearRect(0, 0, W, H);
  if (!snapshot) return;

  const { nodes, highlights } = snapshot;

  if (!nodes || nodes.length === 0) {
    label(ctx, 'head → null', W / 2, H / 2, C.muted, 13);
    label(ctx, '(빈 리스트)', W / 2, H / 2 + 28, C.muted, 10);
    return;
  }

  const NODE_W = Math.min(80, (W - 80) / nodes.length - 16);
  const NODE_H = 52;
  const PTR_W  = 28; // pointer section width
  const BOX_W  = NODE_W + PTR_W;
  const GAP    = 20;
  const ROWS   = Math.ceil(nodes.length / Math.floor((W - 60) / (BOX_W + GAP)));
  const PER_ROW = Math.ceil(nodes.length / ROWS);
  const cy_base = ROWS === 1 ? H / 2 : 80;
  const ROW_GAP = 110;

  // head label
  const firstX = 40;
  const firstY = cy_base;
  ctx.beginPath();
  ctx.moveTo(firstX - 30, firstY);
  ctx.lineTo(firstX - 6, firstY);
  ctx.strokeStyle = C.arrowHL; ctx.lineWidth = 1.5; ctx.stroke();
  drawArrowHead(ctx, firstX - 6, firstY, 'right', C.arrowHL);
  label(ctx, 'head', firstX - 38, firstY, C.arrowHL, 9, 'right');

  nodes.forEach((node, i) => {
    const row   = Math.floor(i / PER_ROW);
    const col   = i % PER_ROW;
    const isLTR = row % 2 === 0;
    const colInRow = isLTR ? col : (Math.min(PER_ROW, nodes.length - row * PER_ROW) - 1 - col);
    const x     = firstX + colInRow * (BOX_W + GAP);
    const y     = cy_base + row * ROW_GAP - NODE_H / 2;
    const cy    = y + NODE_H / 2;
    const hk    = highlights[node.id];

    const valColor   = hk === 'new'     ? C.new
                     : hk === 'active'  ? C.active
                     : hk === 'found'   ? C.found
                     : hk === 'removed' ? C.removed
                     : C.surface;
    const ptrColor   = hk ? '#1e1e3e' : '#1a1a2e';
    const textColor  = hk ? '#fff' : C.label;

    if (hk && hk !== 'muted') {
      ctx.shadowColor = valColor; ctx.shadowBlur = 14;
    }

    // Value box
    drawRoundRect(ctx, x, y, NODE_W, NODE_H, 6, valColor, hk ? valColor : C.border);
    ctx.shadowBlur = 0;
    label(ctx, String(node.value), x + NODE_W / 2, cy, hk === 'muted' ? C.muted : textColor, 14);

    // Pointer box
    drawRoundRect(ctx, x + NODE_W, y, PTR_W, NODE_H, [0, 6, 6, 0], ptrColor, hk ? valColor : C.border);
    label(ctx, node.id === nodes[nodes.length - 1].id ? 'null' : '→', x + NODE_W + PTR_W / 2, cy, C.muted, 8);

    // Index
    label(ctx, `[${i}]`, x + NODE_W / 2, y - 14, C.muted, 9);

    // Arrow to next node
    const isLastInRow = (col === PER_ROW - 1) || (i === nodes.length - 1);
    const hasNext     = i < nodes.length - 1;

    if (hasNext) {
      if (!isLastInRow) {
        // Horizontal arrow
        const nextX = x + BOX_W + GAP;
        ctx.beginPath();
        ctx.moveTo(x + BOX_W, cy);
        ctx.lineTo(nextX, cy);
        ctx.strokeStyle = hk === 'removed' ? C.muted : C.arrowHL;
        ctx.lineWidth = 1.5; ctx.stroke();
        drawArrowHead(ctx, nextX, cy, 'right', C.arrowHL);
      } else {
        // U-turn to next row
        const nx = isLTR
          ? firstX + (Math.min(PER_ROW, nodes.length - (row + 1) * PER_ROW) - 1) * (BOX_W + GAP)
          : firstX;
        const ny = cy + ROW_GAP;
        ctx.beginPath();
        ctx.moveTo(x + BOX_W, cy);
        ctx.lineTo(x + BOX_W + 16, cy);
        ctx.lineTo(x + BOX_W + 16, ny);
        ctx.lineTo(nx + (isLTR ? BOX_W : 0), ny);
        ctx.strokeStyle = C.arrowHL; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        drawArrowHead(ctx, nx + (isLTR ? BOX_W : 0), ny, isLTR ? 'left' : 'right', C.arrowHL);
      }
    } else {
      label(ctx, 'null', x + BOX_W + 10, cy, C.muted, 9, 'left');
    }
  });
}

function drawArrowHead(ctx, x, y, dir, color) {
  const size = 6;
  ctx.beginPath();
  if (dir === 'right') {
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size / 2);
  } else {
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x, y + size / 2);
  }
  ctx.fillStyle = color;
  ctx.fill();
}
