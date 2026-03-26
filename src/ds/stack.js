import { StepController } from '../common/StepController.js';
import { drawStack } from './renderer.js';
import { recordPush, recordPop, recordPeek } from './algorithms.js';

const META = {
  push: {
    opName: 'push', desc: '스택 상단에 새 요소를 추가합니다. O(1) 연산이에요.',
    tags: ['O(1)', 'LIFO', '상단 추가'], tagColors: ['av-badge--green','av-badge--yellow','av-badge--purple'],
  },
  pop: {
    opName: 'pop', desc: '스택 상단의 요소를 꺼내 반환합니다. 스택이 비어있으면 underflow가 발생해요.',
    tags: ['O(1)', 'LIFO', '상단 제거'], tagColors: ['av-badge--green','av-badge--yellow','av-badge--red'],
  },
  peek: {
    opName: 'peek', desc: '스택 상단의 요소를 제거하지 않고 확인합니다.',
    tags: ['O(1)', '제거 없음'], tagColors: ['av-badge--green','av-badge--purple'],
  },
};

const PSEUDO = {
  push: ['push(value):','  stack.append(value)','  top += 1'],
  pop:  ['pop():','  if isEmpty(): raise Underflow','  top -= 1','  return stack[top+1]','  // (요소 제거됨)'],
  peek: ['peek():','  if isEmpty(): raise Underflow','  return stack[top]','  // (제거 없음)'],
};

const SPEEDS = [700,280,110,35,6];
const SPEED_LABELS = ['매우 느림','느림','중간','빠름','매우 빠름'];

let currentAlgo = 'push';
let stackState  = [];

const $ = id => document.getElementById(id);
const canvasWrap = $('canvasWrap');
const canvas     = $('dsCanvas');
const ctx        = canvas.getContext('2d');

function resizeCanvas() { canvas.width = canvasWrap.clientWidth; canvas.height = canvasWrap.clientHeight; }

const ctrl = new StepController({
  onStep(s, idx) {
    drawStack(ctx, canvas.width, canvas.height, s);
    $('stepCur').textContent = idx + 1;
    $('stepDesc').textContent = s.desc;
    updatePseudo(s.hlLine);
    $('sizeVal').textContent = s.items.length;
    $('topVal').textContent  = s.items.length ? s.items[s.items.length - 1] : '—';
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
  drawStack(ctx, canvas.width, canvas.height, {
    items: stackState, highlights: {},
    pointerLabel: stackState.length ? `top → [${stackState.length - 1}]` : 'top → (비어있음)',
  });
}

function runAction() {
  const raw = $('valueInput').value.trim();
  resizeCanvas();

  if (currentAlgo === 'push') {
    if (!raw) return;
    const val = parseInt(raw);
    if (isNaN(val)) return;
    const { snapshots, newState } = recordPush(stackState, val);
    stackState = newState;
    ctrl.load(snapshots);
    $('resultChip').textContent = `push(${val}) 완료`;
  } else if (currentAlgo === 'pop') {
    const { snapshots, newState, popped } = recordPop(stackState);
    stackState = newState;
    ctrl.load(snapshots);
    $('resultChip').textContent = popped !== null ? `pop() = ${popped}` : 'underflow!';
  } else if (currentAlgo === 'peek') {
    const { snapshots } = recordPeek(stackState);
    ctrl.load(snapshots);
    $('resultChip').textContent = stackState.length ? `peek() = ${stackState[stackState.length - 1]}` : 'underflow!';
  }

  $('valueInput').value = '';
}

$('actionBtn').addEventListener('click', runAction);
$('valueInput').addEventListener('keydown', e => { if (e.key === 'Enter') runAction(); });
$('clearBtn').addEventListener('click', () => {
  stackState = [];
  showCurrentState();
  $('stepDesc').textContent = '초기화됨';
  $('resultChip').textContent = '—';
  $('sizeVal').textContent = '0';
  $('topVal').textContent  = '—';
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

updateInfoPanel('push');
updatePseudo(-1);
setTimeout(() => { resizeCanvas(); showCurrentState(); }, 50);
