import { StepController } from '../common/StepController.js';
import { generateGraph, drawGraph } from './renderer.js';
import { recordDijkstra, recordAstar } from './algorithms.js';

const META = {
  dijkstra: {
    name: 'Dijkstra', dsName: 'Priority Queue (min-heap)',
    desc: '가중치 그래프에서 시작 노드로부터 모든 노드까지의 최단 거리를 구합니다. 매 단계에서 아직 확정되지 않은 노드 중 거리가 가장 짧은 것을 선택(greedy)합니다. 음수 가중치는 지원하지 않습니다.',
    tags: ['시간 O((V+E)log V)', '메모리 O(V)', '가중치 그래프', '음수 불가'],
    tagColors: ['av-badge--purple','av-badge--purple','av-badge--yellow','av-badge--red'],
  },
  astar: {
    name: 'A* (에이스타)', dsName: 'Open Set (f = g + h)',
    desc: '휴리스틱 함수 h(n)을 이용해 목표 방향으로 우선 탐색합니다. f(n) = g(n) + h(n) 중 f값이 가장 작은 노드를 선택합니다. 여기서 h는 목표까지의 유클리드 거리입니다.',
    tags: ['시간 O(E)', '메모리 O(V)', '휴리스틱 탐색', '단일 목표'],
    tagColors: ['av-badge--purple','av-badge--purple','av-badge--yellow','av-badge--green'],
  },
};

const PSEUDO = {
  dijkstra: [
    'Dijkstra(graph, start):',
    '  dist[start]=0; 나머지=∞',
    '  pq.push((0, start))',
    '  while pq not empty:',
    '    (d, u) = pq.pop_min()',
    '    if d > dist[u]: continue',
    '    for each (v, w) of u:',
    '      if dist[u]+w < dist[v]:',
    '        dist[v] = dist[u]+w',
    '        pq.push((dist[v], v))',
  ],
  astar: [
    'A*(graph, start, goal):',
    '  gScore[start]=0',
    '  fScore[start]=h(start)',
    '  open = {start}',
    '  while open not empty:',
    '    cur = node with min f',
    '    if cur == goal: return path',
    '    for each neighbor:',
    '      tentG = gScore[cur]+w',
    '      if tentG < gScore[nb]: update',
  ],
};

const SPEEDS = [900, 380, 140, 45, 8];
const SPEED_LABELS = ['매우 느림', '느림', '중간', '빠름', '매우 빠름'];

let currentAlgo = 'dijkstra';
let graph = { nodes: [], edges: [], adjList: {} };
let goalId = null;

const $ = id => document.getElementById(id);
const canvasWrap = $('canvasWrap');
const canvas = $('graphCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = canvasWrap.clientWidth;
  canvas.height = canvasWrap.clientHeight;
}

const ctrl = new StepController({
  onStep(s, idx) {
    drawGraph(ctx, canvas.width, canvas.height, graph.nodes, graph.edges, s,
              { showWeights: true, goalId });
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

ctrl.elFirst=$('firstBtn'); ctrl.elPrev=$('prevBtn');
ctrl.elPlay=$('playBtn');   ctrl.elNext=$('nextBtn');
ctrl.elLast=$('lastBtn');   ctrl.elCur=$('stepCur');
ctrl.elTotal=$('stepTot');
ctrl.bindButtons();
ctrl.bindKeys();

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

function buildSnapshots() {
  const { nodes, edges, adjList } = graph;
  const snaps = currentAlgo === 'dijkstra'
    ? recordDijkstra(nodes, edges, adjList, 0)
    : recordAstar(nodes, edges, adjList, 0, goalId);
  ctrl.load(snaps);
  updatePseudo(-1);
}

function generateAll() {
  resizeCanvas();
  const n = parseInt($('nodeSlider').value);
  graph  = generateGraph(n, canvas.width, canvas.height, true); // always weighted
  goalId = graph.nodes[graph.nodes.length - 1].id;
  updateGoalSelect();
  buildSnapshots();
}

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
  document.querySelectorAll('.av-algo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentAlgo = btn.dataset.algo;
  updateInfoPanel(currentAlgo);
  if (graph.nodes.length) buildSnapshots();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  if (graph.nodes.length) generateAll();
});

updateInfoPanel('dijkstra');
updatePseudo(-1);
setTimeout(() => { resizeCanvas(); generateAll(); }, 50);
