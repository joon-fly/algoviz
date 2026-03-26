import { StepController } from '../common/StepController.js';
import { drawQueue } from './renderer.js';
import { recordEnqueue, recordDequeue, recordQueuePeek } from './algorithms.js';

const META = {
  enqueue: {
    opName: 'enqueue', desc: '큐의 뒤쪽(rear)에 새 요소를 추가합니다. FIFO 원칙에 따라 먼저 들어온 것이 먼저 나가요.',
    tags: ['O(1)', 'FIFO', 'rear 추가'], tagColors: ['av-badge--green','av-badge--yellow','av-badge--purple'],
  },
  dequeue: {
    opName: 'dequeue', desc: '큐의 앞쪽(front)에서 요소를 꺼내 반환합니다. 큐가 비어있으면 underflow가 발생해요.',
    tags: ['O(1)', 'FIFO', 'front 제거'], tagColors: ['av-badge--green','av-badge--yellow','av-badge--red'],
  },
  peek: {
    opName: 'peek', desc: 'front 요소를 제거하지 않고 확인합니다.',
    tags: ['O(1)', '제거 없음'], tagColors: ['av-badge--green','av-badge--purple'],
  },
};

const PSEUDO = {
  enqueue: ['enqueue(value):','  queue.append(value)','  rear += 1'],
  dequeue: ['dequeue():','  if isEmpty(): raise Underflow','  front += 1','  return queue[front-1]','  // (요소 제거됨)'],
  peek:    ['peek():','  if isEmpty(): raise Underflow','  return queue[front]','  // (제거 없음)'],
};

const SPEEDS = [700,280,110,35,6];
const SPEED_LABELS = ['매우 느림','느림','중간','빠름','매우 빠름'];

let currentAlgo = 'enqueue';
let queueState  = [];

const $ = id => document.getElementById(id);
const canvasWrap = $('canvasWrap');
const canvas     = $('dsCanvas');
const ctx        = canvas.getContext('2d');

function resizeCanvas() { canvas.width = canvasWrap.clientWidth; canvas.height = canvasWrap.clientHeight; }

const ctrl = new StepController({
  onStep(s, idx) {
    drawQueue(ctx, canvas.width, canvas.height, s);
    $('stepCur').textContent  = idx + 1;
    $('stepDesc').textContent = s.desc;
    updatePseudo(s.hlLine);
    $('sizeVal').textContent  = s.items.length;
    $('frontVal').textContent = s.items.length ? s.items[0] : '—';
  },
  onStatus(key, label) {
    const el = $('statusBadge');
    el.className = `av-status av-status--${key}`;
    el.textContent = label;
  },
});

ctrl.elFirst=$('firstBtn'); ctrl.elPrev=$('prevBtn');
ctrl.elPlay=$('playBtn');   ctrl.elNext=$('nextBtn');
ctrl.elLast=$('lastBtn');   ctrl.elCur=$('stepCur');
ctrl.elTotal=$('stepTot');
ctrl.bindButtons(); ctrl.bindKeys();

function updateInfoPanel(algo) {
  const m = META[algo];
  $('algoDesc').textContent = m.desc;
  $('opName').textContent   = m.opName;
  $('metaRow').innerHTML    = m.tags.map((t,i) => `<span class="av-badge ${m.tagColors[i]}">${t}</span>`).join('');
}

function updatePseudo(hl) {
  $('pseudoCode').innerHTML = PSEUDO[currentAlgo].map((l,i) =>
    i === hl ? `<span class="hl">${l}</span>` : l
  ).join('\n');
}

function showCurrentState() {
  resizeCanvas();
  drawQueue(ctx, canvas.width, canvas.height, {
    items: queueState, highlights: {},
    frontLabel: queueState.length ? 'front → [0]' : '',
    rearLabel:  queueState.length ? `rear → [${queueState.length-1}]` : '',
  });
}

function runAction() {
  const raw = $('valueInput').value.trim();
  resizeCanvas();

  if (currentAlgo === 'enqueue') {
    if (!raw) return;
    const val = parseInt(raw);
    if (isNaN(val)) return;
    const { snapshots, newState } = recordEnqueue(queueState, val);
    queueState = newState;
    ctrl.load(snapshots);
    $('resultChip').textContent = `enqueue(${val}) 완료`;
  } else if (currentAlgo === 'dequeue') {
    const { snapshots, newState, dequeued } = recordDequeue(queueState);
    queueState = newState;
    ctrl.load(snapshots);
    $('resultChip').textContent = dequeued !== null ? `dequeue() = ${dequeued}` : 'underflow!';
  } else if (currentAlgo === 'peek') {
    const { snapshots } = recordQueuePeek(queueState);
    ctrl.load(snapshots);
    $('resultChip').textContent = queueState.length ? `peek() = ${queueState[0]}` : 'underflow!';
  }

  $('valueInput').value = '';
}

$('actionBtn').addEventListener('click', runAction);
$('valueInput').addEventListener('keydown', e => { if (e.key === 'Enter') runAction(); });
$('clearBtn').addEventListener('click', () => {
  queueState = [];
  showCurrentState();
  $('stepDesc').textContent  = '초기화됨';
  $('resultChip').textContent = '—';
  $('sizeVal').textContent   = '0';
  $('frontVal').textContent  = '—';
});

$('speedSlider').addEventListener('input', () => {
  const v = parseInt($('speedSlider').value) - 1;
  $('speedVal').textContent = SPEED_LABELS[v];
  ctrl.setDelay(SPEEDS[v]);
});

$('algoList').addEventListener('click', e => {
  const btn = e.target.closest('.av-algo-btn'); if (!btn) return;
  document.querySelectorAll('.av-algo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentAlgo = btn.dataset.algo;
  updateInfoPanel(currentAlgo);
  updatePseudo(-1);
  $('opName').textContent    = META[currentAlgo].opName;
  $('actionBtn').textContent = `${META[currentAlgo].opName} 실행`;
  showCurrentState();
});

window.addEventListener('resize', showCurrentState);

updateInfoPanel('enqueue');
updatePseudo(-1);
setTimeout(() => { resizeCanvas(); showCurrentState(); }, 50);
