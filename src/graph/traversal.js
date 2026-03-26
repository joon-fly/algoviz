import { StepController } from '../common/StepController.js';
import { generateGraph, drawGraph } from './renderer.js';
import { recordBFS, recordDFS } from './algorithms.js';

const META = {
  bfs: {
    name: 'BFS (너비 우선 탐색)', dsName: 'Queue (FIFO)',
    desc: '시작 노드에서 가까운 노드부터 차례로 방문합니다. Queue를 사용하며 최단 거리(hop count)를 보장합니다.',
    tags: ['시간 O(V+E)', '메모리 O(V)', 'Queue 사용', '최단 경로 보장'],
    tagColors: ['av-badge--purple','av-badge--purple','av-badge--yellow','av-badge--green'],
  },
  dfs: {
    name: 'DFS (깊이 우선 탐색)', dsName: 'Stack (LIFO)',
    desc: '한 방향으로 끝까지 파고든 뒤 되돌아오며 탐색합니다. Stack 또는 재귀로 구현하며, 경로·사이클·위상 정렬에 활용됩니다.',
    tags: ['시간 O(V+E)', '메모리 O(V)', 'Stack 사용', '경로/사이클 탐색'],
    tagColors: ['av-badge--purple','av-badge--purple','av-badge--yellow','av-badge--green'],
  },
};

const PSEUDO = {
  bfs: ['BFS(graph, start):','  visited = {start}','  queue.enqueue(start)','  while queue not empty:','    node = queue.dequeue()','    process(node)','    for each neighbor:','      if not visited:','        queue.enqueue(neighbor)'],
  dfs: ['DFS(graph, start):','  stack.push(start)','  while stack not empty:','  ','    node = stack.pop()','    if not visited:','      visited.add(node)','      process(node)','      for each neighbor:','        stack.push(neighbor)'],
};

const SPEEDS = [900, 380, 140, 45, 8];
const SPEED_LABELS = ['매우 느림', '느림', '중간', '빠름', '매우 빠름'];

let currentAlgo = 'bfs';
let graph = { nodes: [], edges: [], adjList: {} };

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
    drawGraph(ctx, canvas.width, canvas.height, graph.nodes, graph.edges, s, { showWeights: false });
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
}

function updatePseudo(hl) {
  $('pseudoCode').innerHTML = PSEUDO[currentAlgo].map((l, i) =>
    i === hl ? `<span class="hl">${l}</span>` : l
  ).join('\n');
}

function buildSnapshots() {
  const { nodes, edges, adjList } = graph;
  const snaps = currentAlgo === 'bfs'
    ? recordBFS(nodes, edges, adjList, 0)
    : recordDFS(nodes, edges, adjList, 0);
  ctrl.load(snaps);
  updatePseudo(-1);
}

function generateAll() {
  resizeCanvas();
  const n = parseInt($('nodeSlider').value);
  graph = generateGraph(n, canvas.width, canvas.height, false);
  buildSnapshots();
}

$('generateBtn').addEventListener('click', generateAll);
$('resetBtn').addEventListener('click', () => ctrl.goTo(0));

$('nodeSlider').addEventListener('input',  () => $('nodeVal').textContent = $('nodeSlider').value);
$('nodeSlider').addEventListener('change', generateAll);

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

updateInfoPanel('bfs');
updatePseudo(-1);
setTimeout(() => { resizeCanvas(); generateAll(); }, 50);
