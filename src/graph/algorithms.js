// ── Graph algorithm snapshot recorders ──────────────────────────
// Each takes (nodes, edges, adjList, startNode) and returns snapshots.
// snapshot: { nodeColors, edgeColors, dsItems, visitedCount,
//             visitOrder, orderStr, hlLine, desc, weights? }

function makeSnap(nodeColors, edgeColors, dsItems, visitedCount, visitOrder, orderStr, hlLine, desc, extra={}) {
  return {
    nodeColors:   {...nodeColors},
    edgeColors:   [...edgeColors],
    dsItems:      [...dsItems],
    visitedCount,
    visitOrder:   {...visitOrder},
    orderStr,
    hlLine:       hlLine ?? -1,
    desc:         desc || '',
    ...extra,
  };
}

function edgeIdx(edges, u, v) {
  return edges.findIndex(e => (e.u===u&&e.v===v)||(e.u===v&&e.v===u));
}

// Node color constants
export const NC = {
  unvisited: '#2a2845',
  inqueue:   '#f7c96a',
  visiting:  '#f76a8c',
  visited:   '#6af7c8',
  path:      '#7c6af7',
};

export const EC = {
  default:   '#2a2845',
  traversed: '#3a3860',
  active:    '#f76a8c',
  path:      '#7c6af7',
  relaxed:   '#f7c96a',
};

// ── BFS ──────────────────────────────────────────────────────────
export function recordBFS(nodes, edges, adjList, start=0) {
  const S=[];
  const nc={}, ec=edges.map(()=>EC.default);
  const order={};
  nodes.forEach(n=>nc[n.id]=NC.unvisited);
  let cnt=0, orderStr='';

  const s=(hl,desc,ds)=>S.push(makeSnap(nc,ec,ds,cnt,order,orderStr,hl,desc));

  const queue=[start];
  const visited=new Set([start]);
  nc[start]=NC.inqueue;
  s(1,'시작 노드 Queue에 추가',[...queue]);

  while (queue.length) {
    const node=queue.shift();
    nc[node]=NC.visiting;
    s(4,`Queue에서 노드 ${node} 꺼냄`,[...queue]);
    nc[node]=NC.visited; cnt++; order[node]=cnt;
    orderStr=Object.keys(order).sort((a,b)=>order[a]-order[b]).join('→');
    s(5,`노드 ${node} 방문 완료 (순서: ${cnt})`,[...queue]);

    for (const nb of adjList[node]) {
      const ei=edgeIdx(edges,node,nb);
      ec[ei]=EC.traversed;
      if (!visited.has(nb)) {
        visited.add(nb); nc[nb]=NC.inqueue; queue.push(nb);
        ec[ei]=EC.active;
        s(8,`이웃 ${nb} → Queue 추가`,[...queue]);
        ec[ei]=EC.traversed;
      } else {
        s(7,`이웃 ${nb} 이미 방문됨`,[...queue]);
      }
    }
  }
  s(-1,`BFS 완료 — ${cnt}개 노드 방문`,[]);
  return S;
}

// ── DFS ──────────────────────────────────────────────────────────
export function recordDFS(nodes, edges, adjList, start=0) {
  const S=[];
  const nc={}, ec=edges.map(()=>EC.default);
  const order={};
  nodes.forEach(n=>nc[n.id]=NC.unvisited);
  let cnt=0, orderStr='';

  const s=(hl,desc,ds)=>S.push(makeSnap(nc,ec,ds,cnt,order,orderStr,hl,desc));

  const stack=[start];
  nc[start]=NC.inqueue;
  s(2,'시작 노드 Stack에 push',[...stack].reverse());

  const visited=new Set();
  while (stack.length) {
    const node=stack.pop();
    nc[node]=NC.visiting;
    s(4,`Stack에서 노드 ${node} pop`,[...stack].reverse());
    if (visited.has(node)) {
      nc[node]=NC.visited;
      s(5,`노드 ${node} 이미 방문됨, 건너뜀`,[...stack].reverse());
      continue;
    }
    visited.add(node); nc[node]=NC.visited; cnt++; order[node]=cnt;
    orderStr=Object.keys(order).sort((a,b)=>order[a]-order[b]).join('→');
    s(6,`노드 ${node} 방문 (순서: ${cnt})`,[...stack].reverse());

    const neighbors=[...adjList[node]].reverse();
    for (const nb of neighbors) {
      const ei=edgeIdx(edges,node,nb);
      if (!visited.has(nb)) {
        nc[nb]=NC.inqueue; stack.push(nb);
        ec[ei]=EC.active;
        s(9,`이웃 ${nb} → Stack push`,[...stack].reverse());
        ec[ei]=EC.traversed;
      }
    }
  }
  s(-1,`DFS 완료 — ${cnt}개 노드 방문`,[]);
  return S;
}

// ── Dijkstra ─────────────────────────────────────────────────────
export function recordDijkstra(nodes, edges, adjList, start=0) {
  const S=[];
  const nc={}, ec=edges.map(()=>EC.default);
  const order={};
  const INF=Infinity;
  const dist={}, prev={};
  nodes.forEach(n=>{ nc[n.id]=NC.unvisited; dist[n.id]=INF; prev[n.id]=null; });
  dist[start]=0; nc[start]=NC.inqueue;
  let cnt=0, orderStr='';

  // extra: dist snapshot for rendering labels
  const s=(hl,desc,ds)=>S.push(makeSnap(nc,ec,ds,cnt,order,orderStr,hl,desc,{distMap:{...dist}}));

  s(1,`시작: dist[${start}]=0, 나머지=∞`,[`${start}(0)`]);

  // Simple min-heap via sorted array (small graphs, clarity over perf)
  const pq=[{id:start,d:0}];

  while (pq.length) {
    pq.sort((a,b)=>a.d-b.d);
    const {id:u, d:du}=pq.shift();
    if (du>dist[u]) { s(3,`노드 ${u} 무시 (더 짧은 경로 이미 처리)`,[...pq.map(x=>`${x.id}(${x.d})`)]); continue; }
    nc[u]=NC.visiting;
    s(4,`노드 ${u} 처리 (dist=${dist[u]})`,[...pq.map(x=>`${x.id}(${x.d})`)]);
    nc[u]=NC.visited; cnt++; order[u]=cnt;
    orderStr=Object.keys(order).sort((a,b)=>order[a]-order[b]).join('→');
    s(5,`노드 ${u} 확정 (최단거리=${dist[u]})`,[...pq.map(x=>`${x.id}(${x.d})`)]);

    for (const nb of adjList[u]) {
      const e=edges.find(e=>(e.u===u&&e.v===nb)||(e.u===nb&&e.v===u));
      const w=e?.weight??1;
      const ei=edgeIdx(edges,u,nb);
      ec[ei]=EC.relaxed;
      const newDist=dist[u]+w;
      s(7,`엣지 ${u}→${nb} 완화 시도: ${dist[u]}+${w}=${newDist} vs 현재=${dist[nb]===INF?'∞':dist[nb]}`,[...pq.map(x=>`${x.id}(${x.d})`)]);
      if (newDist<dist[nb]) {
        dist[nb]=newDist; prev[nb]=u;
        if (nc[nb]!==NC.visited) nc[nb]=NC.inqueue;
        pq.push({id:nb,d:newDist});
        ec[ei]=EC.active;
        s(8,`dist[${nb}] 갱신: ${newDist}`,[...pq.map(x=>`${x.id}(${x.d})`)]);
      }
      ec[ei]=nc[nb]===NC.visited?EC.traversed:EC.relaxed;
    }
  }

  // Reconstruct all shortest paths
  nodes.forEach(n=>{
    let cur=n.id;
    while (prev[cur]!==null) {
      const ei=edgeIdx(edges,cur,prev[cur]);
      ec[ei]=EC.path; nc[cur]=NC.path; cur=prev[cur];
    }
  });
  nc[start]=NC.path;
  s(-1,`Dijkstra 완료 — 최단 거리 확정`,[]);
  return S;
}

// ── A* ───────────────────────────────────────────────────────────
export function recordAstar(nodes, edges, adjList, start=0, goal=null) {
  // If no goal, pick the node furthest from start (by index)
  if (goal===null) goal=nodes[nodes.length-1].id;

  // Euclidean heuristic
  const h=(id)=>{
    const a=nodes[id], b=nodes[goal];
    return Math.hypot(a.x-b.x, a.y-b.y);
  };

  const S=[];
  const nc={}, ec=edges.map(()=>EC.default);
  const order={};
  const INF=Infinity;
  const gScore={}, fScore={}, prev={};
  nodes.forEach(n=>{ nc[n.id]=NC.unvisited; gScore[n.id]=INF; fScore[n.id]=INF; prev[n.id]=null; });
  gScore[start]=0; fScore[start]=h(start);
  nc[start]=NC.inqueue; nc[goal]=NC.inqueue;
  let cnt=0, orderStr='';

  const s=(hl,desc,ds)=>S.push(makeSnap(nc,ec,ds,cnt,order,orderStr,hl,desc,{distMap:{...gScore},isAstar:true,goalId:goal}));

  const openSet=new Set([start]);
  const pq=[{id:start,f:fScore[start]}];

  s(1,`시작=${start}, 목표=${goal}, h(start)=${h(start).toFixed(1)}`,[`${start}(f=${fScore[start].toFixed(1)})`]);

  while (openSet.size) {
    pq.sort((a,b)=>a.f-b.f);
    const {id:cur}=pq.shift();
    if (!openSet.has(cur)) continue;
    openSet.delete(cur);

    nc[cur]=NC.visiting;
    s(4,`f값 최소 노드 ${cur} 선택 (g=${gScore[cur].toFixed(1)}, h=${h(cur).toFixed(1)})`,[...pq.map(x=>`${x.id}(${x.f.toFixed(1)})`)]);

    if (cur===goal) {
      nc[cur]=NC.visited; cnt++; order[cur]=cnt;
      // Trace path
      let c=goal;
      while (prev[c]!==null) {
        const ei=edgeIdx(edges,c,prev[c]);
        ec[ei]=EC.path; nc[c]=NC.path; c=prev[c];
      }
      nc[start]=NC.path;
      s(-1,`목표 노드 ${goal} 도달! 최단 경로 표시`,[]);
      return S;
    }

    nc[cur]=NC.visited; cnt++; order[cur]=cnt;
    orderStr=Object.keys(order).sort((a,b)=>order[a]-order[b]).join('→');
    s(5,`노드 ${cur} 처리 완료`,[...pq.map(x=>`${x.id}(${x.f.toFixed(1)})`)]);

    for (const nb of adjList[cur]) {
      const e=edges.find(e=>(e.u===cur&&e.v===nb)||(e.u===nb&&e.v===cur));
      const w=e?.weight??1;
      const ei=edgeIdx(edges,cur,nb);
      ec[ei]=EC.relaxed;
      const tentG=gScore[cur]+w;
      s(7,`이웃 ${nb}: g=${tentG.toFixed(1)}, h=${h(nb).toFixed(1)}, f=${(tentG+h(nb)).toFixed(1)}`,[...pq.map(x=>`${x.id}(${x.f.toFixed(1)})`)]);
      if (tentG<gScore[nb]) {
        gScore[nb]=tentG; fScore[nb]=tentG+h(nb); prev[nb]=cur;
        if (nc[nb]!==NC.visited) nc[nb]=NC.inqueue;
        openSet.add(nb);
        pq.push({id:nb,f:fScore[nb]});
        ec[ei]=EC.active;
        s(8,`노드 ${nb} 갱신: g=${tentG.toFixed(1)}, f=${fScore[nb].toFixed(1)}`,[...pq.map(x=>`${x.id}(${x.f.toFixed(1)})`)]);
      }
      if (ec[ei]!==EC.active) ec[ei]=nc[nb]===NC.visited?EC.traversed:EC.relaxed;
    }
  }
  s(-1,`A* 완료 (경로 없음)`,[]);
  return S;
}
