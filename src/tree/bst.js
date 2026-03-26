// ── BST Snapshot Recorder ────────────────────────────────────────
// Snapshots: { nodes, edges, highlights, desc, hlLine, foundId, pathIds }
// nodes: [{id, value, x, y, left, right, parent}]
// highlights: {[id]: colorKey}  colorKey: 'visiting'|'found'|'inserted'|'deleted'|'path'

// ── Tree node factory ─────────────────────────────────────────────
let _uid = 0;
function mkNode(value) {
  return { id: _uid++, value, left: null, right: null, parent: null };
}

// ── Layout: assign x,y to each node ──────────────────────────────
// Uses in-order rank for x, depth for y
function layoutTree(root, W, H) {
  if (!root) return [];
  const nodes = [];

  // Collect in in-order
  let rank = 0;
  function inOrder(node) {
    if (!node) return;
    inOrder(node.left);
    node._rank = rank++;
    nodes.push(node);
    inOrder(node.right);
  }
  inOrder(root);

  const n = nodes.length;
  const PAD_X = 40, PAD_Y = 60;
  const usableW = W - PAD_X*2;
  const usableH = H - PAD_Y*2;

  // Depth
  function depth(node, d=0) {
    if (!node) return d-1;
    return Math.max(depth(node.left,d+1), depth(node.right,d+1));
  }
  const maxDepth = depth(root);

  function assignXY(node, d=0) {
    if (!node) return;
    node._x = PAD_X + (n>1 ? node._rank/(n-1)*usableW : usableW/2);
    node._y = PAD_Y + (maxDepth>0 ? d/maxDepth*usableH : usableH/2);
    assignXY(node.left, d+1);
    assignXY(node.right, d+1);
  }
  assignXY(root);

  return nodes;
}

// ── Serialize tree state for snapshot ────────────────────────────
function serializeTree(root, W, H) {
  const nodes = layoutTree(root, W, H);
  const edges = [];
  nodes.forEach(n => {
    if (n.left)  edges.push({parentId:n.id, childId:n.left.id, side:'left'});
    if (n.right) edges.push({parentId:n.id, childId:n.right.id, side:'right'});
  });
  return {
    nodes: nodes.map(n=>({id:n.id, value:n.value, x:n._x, y:n._y,
                           leftId:n.left?.id??null, rightId:n.right?.id??null})),
    edges,
  };
}

// ── Deep clone tree ───────────────────────────────────────────────
function cloneTree(node, parent=null) {
  if (!node) return null;
  const c = {id:node.id, value:node.value, left:null, right:null, parent};
  c.left  = cloneTree(node.left,  c);
  c.right = cloneTree(node.right, c);
  return c;
}

function findNode(root, id) {
  if (!root) return null;
  if (root.id===id) return root;
  return findNode(root.left,id) || findNode(root.right,id);
}

// ── Record helpers ────────────────────────────────────────────────
function makeSnap(root, highlights, hlLine, desc, W, H, extra={}) {
  const {nodes, edges} = serializeTree(root, W, H);
  return { nodes, edges, highlights:{...highlights}, hlLine:hlLine??-1, desc:desc||'', ...extra };
}

// ── BST Insert ───────────────────────────────────────────────────
export function recordInsert(initialRoot, value, W=600, H=400) {
  _uid = getMaxId(initialRoot) + 1;
  const S = [];
  let root = cloneTree(initialRoot);
  const hl = {};

  const s=(hl,line,desc)=>S.push(makeSnap(root,hl,line,desc,W,H));

  s({},0,`${value} 삽입 시작`);

  if (!root) {
    root = mkNode(value);
    s({[root.id]:'inserted'},2,`트리가 비어있음 → 루트로 삽입: ${value}`);
    s({[root.id]:'found'},-1,`삽입 완료 ✓`);
    return {snapshots:S, newRoot:root};
  }

  let cur = root;
  const path = [];

  while (true) {
    hl[cur.id] = 'visiting'; path.push(cur.id);
    s({...hl},3,`노드 ${cur.value} 방문`);

    if (value < cur.value) {
      s({...hl},4,`${value} < ${cur.value} → 왼쪽으로`);
      if (!cur.left) {
        const newNode = mkNode(value);
        cur.left = newNode; newNode.parent = cur;
        // Re-layout and highlight
        const newHL = {};
        path.forEach(id=>newHL[id]='path');
        newHL[newNode.id]='inserted';
        s(newHL,6,`왼쪽 자식 없음 → ${value} 삽입`);
        s({[newNode.id]:'found'},-1,'삽입 완료 ✓');
        return {snapshots:S, newRoot:root};
      }
      hl[cur.id]='path'; cur=cur.left;
    } else if (value > cur.value) {
      s({...hl},5,`${value} > ${cur.value} → 오른쪽으로`);
      if (!cur.right) {
        const newNode = mkNode(value);
        cur.right = newNode; newNode.parent = cur;
        const newHL = {};
        path.forEach(id=>newHL[id]='path');
        newHL[newNode.id]='inserted';
        s(newHL,7,`오른쪽 자식 없음 → ${value} 삽입`);
        s({[newNode.id]:'found'},-1,'삽입 완료 ✓');
        return {snapshots:S, newRoot:root};
      }
      hl[cur.id]='path'; cur=cur.right;
    } else {
      s({[cur.id]:'found'},8,`${value} 이미 존재 — 삽입 생략`);
      return {snapshots:S, newRoot:root};
    }
  }
}

// ── BST Search ───────────────────────────────────────────────────
export function recordSearch(root, value, W=600, H=400) {
  const S = [];
  const hl = {};

  const s=(hl,line,desc)=>S.push(makeSnap(root,hl,line,desc,W,H));
  s({},0,`${value} 탐색 시작`);

  let cur = root;
  while (cur) {
    hl[cur.id]='visiting';
    s({...hl},2,`노드 ${cur.value} 방문`);
    if (value===cur.value) {
      s({[cur.id]:'found'},-1,`${value} 발견! ✓`);
      return S;
    } else if (value<cur.value) {
      s({...hl},4,`${value} < ${cur.value} → 왼쪽`);
      hl[cur.id]='path'; cur=cur.left;
    } else {
      s({...hl},5,`${value} > ${cur.value} → 오른쪽`);
      hl[cur.id]='path'; cur=cur.right;
    }
  }
  s({},6,`${value} 없음 — 탐색 실패`);
  return S;
}

// ── BST Delete ───────────────────────────────────────────────────
export function recordDelete(initialRoot, value, W=600, H=400) {
  const S = [];
  let root = cloneTree(initialRoot);
  const hl = {};

  const s=(h,line,desc)=>S.push(makeSnap(root,h,line,desc,W,H));
  s({},0,`${value} 삭제 시작`);

  // Find target
  let cur=root, parent=null, side=null;
  while (cur && cur.value!==value) {
    hl[cur.id]='visiting';
    s({...hl},2,`노드 ${cur.value} 방문`);
    parent=cur;
    if (value<cur.value) { hl[cur.id]='path'; cur=cur.left; side='left'; }
    else                 { hl[cur.id]='path'; cur=cur.right; side='right'; }
  }
  if (!cur) { s({},6,`${value} 없음 — 삭제 불가`); return {snapshots:S,newRoot:root}; }

  s({...hl,[cur.id]:'found'},3,`삭제 대상 ${value} 발견`);

  // Case 1: leaf
  if (!cur.left && !cur.right) {
    if (!parent) { root=null; }
    else if (side==='left') parent.left=null;
    else parent.right=null;
    s({},-1,`${value} 삭제 완료 (리프 노드) ✓`);
  }
  // Case 2: one child
  else if (!cur.left || !cur.right) {
    const child=cur.left||cur.right;
    if (!parent) { root=child; child.parent=null; }
    else if (side==='left') { parent.left=child; child.parent=parent; }
    else { parent.right=child; child.parent=parent; }
    s({[child.id]:'inserted'},-1,`${value} 삭제 완료 (자식 1개) ✓`);
  }
  // Case 3: two children → in-order successor
  else {
    s({...hl,[cur.id]:'found'},4,`자식 2개 → 중위 후계자(in-order successor) 탐색`);
    let succ=cur.right, succParent=cur;
    while (succ.left) {
      hl[succ.id]='visiting';
      s({...hl,[cur.id]:'found'},5,`후계자 탐색: ${succ.value}`);
      hl[succ.id]='path'; succParent=succ; succ=succ.left;
    }
    s({...hl,[cur.id]:'found',[succ.id]:'inserted'},5,`후계자: ${succ.value}`);
    cur.value = succ.value;
    if (succParent===cur) succParent.right=succ.right;
    else succParent.left=succ.right;
    if (succ.right) succ.right.parent=succParent;
    s({},-1,`${value} → ${succ.value}으로 대체 후 삭제 완료 ✓`);
  }
  return {snapshots:S, newRoot:root};
}

// ── BST Renderer ─────────────────────────────────────────────────
export function drawBST(ctx, W, H, snapshot) {
  ctx.clearRect(0,0,W,H);
  if (!snapshot || !snapshot.nodes.length) {
    ctx.fillStyle='#5a5880';
    ctx.font='14px "Space Mono",monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('트리가 비어있습니다. 값을 삽입해보세요.',W/2,H/2);
    return;
  }

  const NODE_R = Math.max(18, Math.min(26, 300/snapshot.nodes.length));
  const nodeMap = {};
  snapshot.nodes.forEach(n=>nodeMap[n.id]=n);

  const COLOR = {
    default:  '#2a2845',
    visiting: '#f76a8c',
    found:    '#6af7c8',
    inserted: '#7c6af7',
    deleted:  '#f76a8c',
    path:     '#3a3060',
  };

  // Edges — draw directional arrows
  snapshot.edges.forEach(({parentId,childId,side}) => {
    const p=nodeMap[parentId], c=nodeMap[childId];
    if (!p||!c) return;
    // Edge color: highlight if child is active
    const childHk = snapshot.highlights[childId];
    const isHighlighted = childHk==='visiting'||childHk==='inserted'||childHk==='found';
    ctx.beginPath();
    ctx.moveTo(p.x,p.y); ctx.lineTo(c.x,c.y);
    ctx.strokeStyle = isHighlighted ? '#5a4880' : '#2a2845';
    ctx.lineWidth   = isHighlighted ? 2 : 1.5;
    ctx.stroke();

    // L / R label on edge midpoint
    const mx=(p.x+c.x)/2, my=(p.y+c.y)/2;
    if (side) {
      ctx.fillStyle='rgba(90,88,128,0.7)';
      ctx.font='bold 9px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(side==='left'?'L':'R', mx+6, my-6);
    }
  });

  // Nodes
  snapshot.nodes.forEach(node => {
    const hk  = snapshot.highlights[node.id] || 'default';
    const col = COLOR[hk] || COLOR.default;
    const isVisiting  = hk==='visiting';
    const isFound     = hk==='found';
    const isInserted  = hk==='inserted';
    const isActive    = isVisiting||isFound||isInserted;

    // Glow ring
    if (isActive) {
      ctx.beginPath(); ctx.arc(node.x,node.y,NODE_R+8,0,Math.PI*2);
      ctx.fillStyle = isFound    ? 'rgba(106,247,200,0.15)' :
                      isInserted ? 'rgba(124,106,247,0.15)' :
                                   'rgba(247,106,140,0.15)';
      ctx.fill();
    }

    // Node circle
    ctx.beginPath(); ctx.arc(node.x,node.y,NODE_R,0,Math.PI*2);
    ctx.fillStyle=col; ctx.fill();
    ctx.strokeStyle=isActive?col:'rgba(255,255,255,0.07)';
    ctx.lineWidth=isActive?2:1; ctx.stroke();

    // Value label
    ctx.fillStyle = hk==='path' ? '#6060a0' : '#0a0a0f';
    ctx.font=`bold ${Math.max(9,NODE_R*0.65)}px "Space Mono",monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(node.value,node.x,node.y);

    // Comparison callout for visiting node — shows "<" or ">" direction
    if (isVisiting && snapshot.desc) {
      const desc = snapshot.desc;
      let arrow='', arrowColor='#e2e0ff';
      if (desc.includes('왼쪽')) { arrow='← 왼쪽'; arrowColor='#6a9af7'; }
      else if (desc.includes('오른쪽')) { arrow='오른쪽 →'; arrowColor='#f7a06a'; }

      if (arrow) {
        const bx = node.x + (arrow.startsWith('←') ? -(NODE_R+50) : NODE_R+10);
        const by = node.y;
        const bw = 72, bh = 22, br = 6;

        // Bubble background
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bx-4, by-bh/2, bw, bh, br)
                      : ctx.rect(bx-4, by-bh/2, bw, bh);
        ctx.fillStyle='rgba(10,10,15,0.88)'; ctx.fill();
        ctx.strokeStyle=arrowColor; ctx.lineWidth=1; ctx.stroke();

        // Arrow text
        ctx.fillStyle=arrowColor;
        ctx.font=`bold 10px "Space Mono",monospace`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(arrow, bx + bw/2 - 4, by);
      }
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────
function getMaxId(node) {
  if (!node) return -1;
  return Math.max(node.id, getMaxId(node.left), getMaxId(node.right));
}

export function buildInitialBST(values) {
  _uid = 0;
  let root = null;
  for (const v of values) root = insertBST(root, v);
  return root;
}

function insertBST(root, value) {
  if (!root) return mkNode(value);
  if (value<root.value) root.left=insertBST(root.left,value);
  else if (value>root.value) root.right=insertBST(root.right,value);
  return root;
}

export function inOrderValues(root) {
  if (!root) return [];
  return [...inOrderValues(root.left), root.value, ...inOrderValues(root.right)];
}
