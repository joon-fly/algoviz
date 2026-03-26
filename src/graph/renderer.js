// ── Graph Generator ──────────────────────────────────────────────
export function generateGraph(n, W, H, weighted=false) {
  const nodeR = Math.max(14, Math.min(22, 220/n));
  const pad   = nodeR + 20;
  const cx = W/2, cy = H/2;
  const rx = W/2 - pad, ry = H/2 - pad;

  const nodes = [];
  for (let i=0; i<n; i++) {
    const angle  = (2*Math.PI*i/n) - Math.PI/2;
    const jx = (Math.random()-0.5)*rx*0.22;
    const jy = (Math.random()-0.5)*ry*0.22;
    const x = Math.max(pad, Math.min(W-pad, cx + rx*Math.cos(angle) + jx));
    const y = Math.max(pad, Math.min(H-pad, cy + ry*Math.sin(angle) + jy));
    nodes.push({id:i, x, y, label:String(i)});
  }

  // Spanning tree to guarantee connectivity
  const edges = [];
  const visited = new Set([0]);
  const pool = nodes.map((_,i)=>i).filter(i=>i>0);
  while (pool.length) {
    const u = [...visited][Math.floor(Math.random()*visited.size)];
    const idx = Math.floor(Math.random()*pool.length);
    const v = pool.splice(idx,1)[0];
    const w = weighted ? Math.floor(Math.random()*9)+1 : 1;
    edges.push({u,v,weight:w});
    visited.add(v);
  }
  // Extra edges
  const extra = Math.floor(n*0.55);
  for (let k=0; k<extra; k++) {
    const u=Math.floor(Math.random()*n), v=Math.floor(Math.random()*n);
    if (u!==v && !edges.some(e=>(e.u===u&&e.v===v)||(e.u===v&&e.v===u))) {
      const w = weighted ? Math.floor(Math.random()*9)+1 : 1;
      edges.push({u,v,weight:w});
    }
  }

  // Adjacency list
  const adjList = {};
  nodes.forEach(n=>adjList[n.id]=[]);
  edges.forEach(({u,v})=>{ adjList[u].push(v); adjList[v].push(u); });
  Object.keys(adjList).forEach(k=>adjList[k].sort((a,b)=>a-b));

  return {nodes, edges, adjList};
}

// ── Graph Renderer ───────────────────────────────────────────────
export function drawGraph(ctx, W, H, nodes, edges, snapshot, opts={}) {
  const {showWeights=false, goalId=null} = opts;
  ctx.clearRect(0,0,W,H);
  const nodeR = Math.max(14, Math.min(22, 220/nodes.length));

  // Edges
  edges.forEach(({u,v,weight},i) => {
    const nu=nodes[u], nv=nodes[v];
    const ec=snapshot.edgeColors[i];
    ctx.beginPath();
    ctx.moveTo(nu.x,nu.y);
    ctx.lineTo(nv.x,nv.y);
    ctx.strokeStyle = ec;
    ctx.lineWidth   = (ec==='#f76a8c'||ec==='#7c6af7') ? 2.5 : 1.5;
    ctx.stroke();

    // Weight label
    if (showWeights && weight && weight>1) {
      const mx=(nu.x+nv.x)/2, my=(nu.y+nv.y)/2;
      ctx.fillStyle='rgba(10,10,15,0.75)';
      ctx.beginPath(); ctx.arc(mx,my,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#f7c96a';
      ctx.font='bold 9px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(weight,mx,my);
    }
  });

  // Nodes
  nodes.forEach(node => {
    const nc   = snapshot.nodeColors[node.id];
    const isVisiting = nc==='#f76a8c';
    const isGoal     = node.id===goalId;
    const distVal    = snapshot.distMap?.[node.id];

    // Glow
    if (isVisiting||isGoal) {
      ctx.beginPath();
      ctx.arc(node.x,node.y,nodeR+7,0,Math.PI*2);
      ctx.fillStyle=isGoal?'rgba(124,106,247,0.2)':'rgba(247,106,140,0.18)';
      ctx.fill();
    }

    // Circle
    ctx.beginPath();
    ctx.arc(node.x,node.y,nodeR,0,Math.PI*2);
    ctx.fillStyle=nc;
    ctx.fill();
    ctx.strokeStyle=isVisiting?'#f76a8c':'rgba(255,255,255,0.08)';
    ctx.lineWidth=isVisiting?2:1;
    ctx.stroke();

    // Node label
    ctx.fillStyle='#0a0a0f';
    ctx.font=`bold ${Math.max(10,nodeR*0.7)}px "Space Mono",monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(node.label,node.x,node.y);

    // Visit order badge
    if (snapshot.visitOrder[node.id]!==undefined) {
      const ox=node.x+nodeR*0.75, oy=node.y-nodeR*0.75;
      ctx.beginPath(); ctx.arc(ox,oy,9,0,Math.PI*2);
      ctx.fillStyle='#7c6af7'; ctx.fill();
      ctx.fillStyle='#fff';
      ctx.font='bold 9px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(snapshot.visitOrder[node.id],ox,oy);
    }

    // Distance label (Dijkstra / A*)
    if (showWeights && distVal!==undefined && distVal!==Infinity) {
      const ox=node.x-nodeR*0.75, oy=node.y+nodeR*0.75;
      ctx.beginPath(); ctx.arc(ox,oy,10,0,Math.PI*2);
      ctx.fillStyle='rgba(10,10,15,0.85)'; ctx.fill();
      ctx.strokeStyle='#f7c96a'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#f7c96a';
      ctx.font=`bold 8px "Space Mono",monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(typeof distVal==='number'?distVal.toFixed(0):distVal,ox,oy);
    }

    // Goal marker
    if (isGoal) {
      ctx.beginPath();
      ctx.arc(node.x,node.y,nodeR+3,0,Math.PI*2);
      ctx.strokeStyle='#7c6af7'; ctx.lineWidth=2;
      ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
    }
  });
}
