import { StepController } from '../common/StepController.js';
import { generateGraph, drawGraph } from './renderer.js';
import { recordBFS, recordDFS, recordDijkstra, recordAstar } from './algorithms.js';

// ── Metadata ──────────────────────────────────────────────────────
const META = {
  bfs: {
    name:'BFS (너비 우선 탐색)', dsName:'Queue (FIFO)', weighted:false,
    desc:'시작 노드에서 가까운 노드부터 차례로 방문합니다. Queue를 사용하며 최단 거리(hop count)를 보장합니다.',
    tags:['시간 O(V+E)','메모리 O(V)','Queue 사용','최단 경로 보장'],
    tagColors:['av-badge--purple','av-badge--purple','av-badge--yellow','av-badge--green'],
  },
  dfs: {
    name:'DFS (깊이 우선 탐색)', dsName:'Stack (LIFO)', weighted:false,
    desc:'한 방향으로 끝까지 파고든 뒤 되돌아오며 탐색합니다. Stack 또는 재귀로 구현하며, 경로·사이클·위상 정렬에 활용됩니다.',
    tags:['시간 O(V+E)','메모리 O(V)','Stack 사용','경로/사이클 탐색'],
    tagColors:['av-badge--purple','av-badge--purple','av-badge--yellow','av-badge--green'],
  },
  dijkstra: {
    name:'Dijkstra', dsName:'Priority Queue (min-heap)', weighted:true,
    desc:'가중치 그래프에서 시작 노드로부터 모든 노드까지의 최단 거리를 구합니다. 음수 가중치는 지원하지 않습니다.',
    tags:['시간 O((V+E)log V)','메모리 O(V)','가중치 그래프','음수 불가'],
    tagColors:['av-badge--purple','av-badge--purple','av-badge--yellow','av-badge--red'],
  },
  astar: {
    name:'A* (에이스타)', dsName:'Open Set (f값 기준)', weighted:true,
    desc:'휴리스틱 함수(h)를 이용해 목표 노드 방향으로 우선 탐색합니다. Dijkstra보다 빠르게 최단 경로를 찾습니다.',
    tags:['시간 O(E)','메모리 O(V)','휴리스틱 탐색','단일 목표'],
    tagColors:['av-badge--purple','av-badge--purple','av-badge--yellow','av-badge--green'],
  },
};

const PSEUDO = {
  bfs:['BFS(graph, start):','  visited = {start}','  queue.enqueue(start)','  while queue not empty:','    node = queue.dequeue()','    process(node)','    for each neighbor:','      if not visited:','        queue.enqueue(neighbor)'],
  dfs:['DFS(graph, start):','  stack.push(start)','  while stack not empty:','  ','    node = stack.pop()','    if not visited:','      visited.add(node)','      process(node)','      for each neighbor:','        stack.push(neighbor)'],
  dijkstra:['Dijkstra(graph, start):','  dist[start]=0; 나머지=∞','  pq.push((0, start))','  while pq not empty:','    (d, u) = pq.pop_min()','    if d > dist[u]: continue','    for each (v, w) of u:','      if dist[u]+w < dist[v]:','        dist[v] = dist[u]+w','        pq.push((dist[v], v))'],
  astar:['A*(graph, start, goal):','  gScore[start]=0','  fScore[start]=h(start)','  open = {start}','  while open not empty:','    cur = node with min f','    if cur == goal: return path','    for each neighbor:','      tentG = gScore[cur]+w','      if tentG < gScore[nb]: update'],
};

const SPEEDS       = [900, 380, 140, 45, 8];
const SPEED_LABELS = ['매우 느림', '느림', '중간', '빠름', '매우 빠름'];

// ── State ─────────────────────────────────────────────────────────
let currentAlgo = 'bfs';
let graph = { nodes:[], edges:[], adjList:{} };
let goalId = null;

// ── DOM ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvasWrap = $('canvasWrap');
const canvas     = $('graphCanvas');
const ctx        = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = canvasWrap.clientWidth;
  canvas.height = canvasWrap.clientHeight;
}

// ── StepController ────────────────────────────────────────────────
const ctrl = new StepController({
  onStep(s, idx) {
    drawGraph(ctx, canvas.width, canvas.height, graph.nodes, graph.edges, s,
              { showWeights: META[currentAlgo].weighted, goalId });
    $('visitedCount').textContent = s.visitedCount;
    $('orderStr').textContent     = s.orderStr || '—';
    $('stepCur').textContent      = idx + 1;
    $('stepDesc').textContent     = s.desc;
    updatePseudo(s.hlLine);
    $('dsItems').innerHTML = s.dsItems.map((id, i) =>
      `<div class="ds-item ${i===0?'head':''}">${id}</div>`
    ).join('');
  },
  onStatus(key, label) {
    const el = $('statusBadge');
    el.className   = `av-status av-status--${key}`;
    el.textContent = label;
  },
});

ctrl.elFirst = $('firstBtn'); ctrl.elPrev  = $('prevBtn');
ctrl.elPlay  = $('playBtn');  ctrl.elNext  = $('nextBtn');
ctrl.elLast  = $('lastBtn');  ctrl.elCur   = $('stepCur');
ctrl.elTotal = $('stepTot');
ctrl.bindButtons();
ctrl.bindKeys();

// ── UI helpers ────────────────────────────────────────────────────
function updateInfoPanel(algo) {
  const m = META[algo];
  $('algoDesc').textContent = m.desc;
  $('algoName').textContent = m.name;
  $('dsLabel').textContent  = m.dsName;
  $('metaRow').innerHTML = m.tags.map((t, i) =>
    `<span class="av-badge ${m.tagColors[i]}">${t}</span>`
  ).join('');
  $('goalRow').classList.toggle('hidden', algo !== 'astar');
}

function updatePseudo(hl) {
  $('pseudoCode').innerHTML = PSEUDO[currentAlgo].map((l, i) =>
    i === hl ? `<span class="hl">${l}</span>` : l
  ).join('\n');
}

function updateGoalSelect() {
  const sel = $('goalSelect');
  sel.innerHTML = graph.nodes.map(n =>
    `<option value="${n.id}" ${n.id===goalId?'selected':''}>${n.id}</option>`
  ).join('');
  if (goalId === null || !graph.nodes.find(n => n.id === goalId)) {
    goalId    = graph.nodes[graph.nodes.length - 1]?.id ?? 0;
    sel.value = goalId;
  }
}

// ── Build snapshots — runs current algo on existing graph ─────────
function buildSnapshots() {
  const { nodes, edges, adjList } = graph;
  let snaps;
  if      (currentAlgo === 'bfs')      snaps = recordBFS(nodes, edges, adjList, 0);
  else if (currentAlgo === 'dfs')      snaps = recordDFS(nodes, edges, adjList, 0);
  else if (currentAlgo === 'dijkstra') snaps = recordDijkstra(nodes, edges, adjList, 0);
  else                                 snaps = recordAstar(nodes, edges, adjList, 0, goalId);
  ctrl.load(snaps);
  updatePseudo(-1);
}

// ── Generate — rebuilds graph with correct edge type ──────────────
function generateAll() {
  resizeCanvas();
  const n        = parseInt($('nodeSlider').value);
  const weighted = META[currentAlgo].weighted;
  graph  = generateGraph(n, canvas.width, canvas.height, weighted);
  goalId = graph.nodes[graph.nodes.length - 1].id;
  updateGoalSelect();
  buildSnapshots();
}

// ── Events ────────────────────────────────────────────────────────
$('generateBtn').addEventListener('click', generateAll);
$('resetBtn').addEventListener('click', () => ctrl.goTo(0));

$('nodeSlider').addEventListener('input',  () => $('nodeVal').textContent = $('nodeSlider').value);
$('nodeSlider').addEventListener('change', generateAll);

$('goalSelect').addEventListener('change', () => {
  goalId = parseInt($('goalSelect').value);
  if (graph.nodes.length) buildSnapshots();
});

$('speedSlider').addEventListener('input', () => {
  const v = parseInt($('speedSlider').value) - 1;
  $('speedVal').textContent = SPEED_LABELS[v];
  ctrl.setDelay(SPEEDS[v]);
});

$('algoList').addEventListener('click', e => {
  const btn = e.target.closest('.av-algo-btn');
  if (!btn) return;

  // 1. Save weighted state BEFORE changing currentAlgo
  const wasWeighted = META[currentAlgo].weighted;

  // 2. Switch algo
  document.querySelectorAll('.av-algo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentAlgo = btn.dataset.algo;

  // 3. Update UI
  updateInfoPanel(currentAlgo);

  if (!graph.nodes.length) return;

  // 4. Only regenerate graph if weighted setting changed
  //    (unweighted ↔ weighted requires different edges)
  if (META[currentAlgo].weighted !== wasWeighted) {
    generateAll();
  } else {
    // Same graph, just run different algorithm
    buildSnapshots();
  }
});

// Resize: only redraw current snapshot, do NOT regenerate graph
window.addEventListener('resize', () => {
  resizeCanvas();
  // Re-layout nodes to new canvas size then rebuild snapshots
  if (graph.nodes.length) generateAll();
});

// ── Boot ──────────────────────────────────────────────────────────
// Support ?algo=dijkstra (or dfs / astar) from index.html card links
const urlAlgo = new URLSearchParams(window.location.search).get('algo');
if (urlAlgo && META[urlAlgo]) {
  currentAlgo = urlAlgo;
  document.querySelectorAll('.av-algo-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.algo === urlAlgo);
  });
}
updateInfoPanel(currentAlgo);
updatePseudo(-1);
setTimeout(() => { resizeCanvas(); generateAll(); }, 50);
