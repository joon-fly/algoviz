import { StepController } from '../common/StepController.js';
import { drawLinkedList } from './renderer.js';
import { recordLLAppend, recordLLPrepend, recordLLDelete, recordLLSearch, buildLL, llLength } from './algorithms.js';

const META = {
  append: {
    opName: 'append', desc: '리스트 끝(tail)에 새 노드를 추가합니다. tail까지 순회해야 하므로 O(n)이에요. (tail 포인터가 있으면 O(1))',
    tags: ['O(n)', '끝에 삽입'], tagColors: ['av-badge--yellow','av-badge--purple'],
  },
  prepend: {
    opName: 'prepend', desc: '리스트 앞(head)에 새 노드를 추가합니다. head만 업데이트하면 되므로 O(1)이에요.',
    tags: ['O(1)', '앞에 삽입'], tagColors: ['av-badge--green','av-badge--purple'],
  },
  delete: {
    opName: 'delete', desc: '값이 일치하는 첫 번째 노드를 삭제합니다. 이전 노드(prev)의 next 포인터를 수정해 연결을 끊어요.',
    tags: ['O(n)', 'prev.next 수정'], tagColors: ['av-badge--yellow','av-badge--red'],
  },
  search: {
    opName: 'search', desc: 'head부터 순서대로 탐색합니다. 최악의 경우 O(n)이에요. 배열과 달리 인덱스로 바로 접근할 수 없어요.',
    tags: ['O(n)', '순차 탐색'], tagColors: ['av-badge--yellow','av-badge--purple'],
  },
};

const PSEUDO = {
  append:  ['append(value):','  newNode = Node(value)','  if head == null: head = newNode; return','  cur = head','  while cur.next != null:','    cur = cur.next  // tail 탐색','  cur.next = newNode'],
  prepend: ['prepend(value):','  newNode = Node(value)','  newNode.next = head','  head = newNode'],
  delete:  ['delete(value):','  if head == null: return','  if head.val == value:','    head = head.next; return','  prev = head; cur = head.next','  while cur != null:','    if cur.val == value:','      prev.next = cur.next; return','    prev = cur; cur = cur.next'],
  search:  ['search(value):','  cur = head; idx = 0','  while cur != null:','    if cur.val == value: return idx  // 발견','    cur = cur.next; idx++','  return -1  // 없음'],
};

const SPEEDS = [700,280,110,35,6];
const SPEED_LABELS = ['매우 느림','느림','중간','빠름','매우 빠름'];

let currentAlgo = 'append';
let llHead = null;

const $ = id => document.getElementById(id);
const canvasWrap = $('canvasWrap');
const canvas     = $('dsCanvas');
const ctx        = canvas.getContext('2d');

function resizeCanvas() { canvas.width = canvasWrap.clientWidth; canvas.height = canvasWrap.clientHeight; }

const ctrl = new StepController({
  onStep(s, idx) {
    drawLinkedList(ctx, canvas.width, canvas.height, s);
    $('stepCur').textContent  = idx + 1;
    $('stepDesc').textContent = s.desc;
    updatePseudo(s.hlLine);
    $('sizeVal').textContent  = s.nodes.length;
    $('headVal').textContent  = s.nodes.length ? s.nodes[0].value : '—';
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
  // Build a snapshot representing current state (no highlights)
  function toNodes(head) {
    const arr = [];
    let cur = head;
    while (cur) { arr.push({ id: cur.id, value: cur.value }); cur = cur.next; }
    return arr;
  }
  drawLinkedList(ctx, canvas.width, canvas.height, {
    nodes: toNodes(llHead), highlights: {}, hlLine: -1, desc: '',
  });
  $('sizeVal').textContent = llLength(llHead);
  $('headVal').textContent = llHead ? llHead.value : '—';
}

function runAction() {
  const raw = $('valueInput').value.trim();
  resizeCanvas();

  if (currentAlgo === 'append') {
    if (!raw) return;
    const val = parseInt(raw);
    if (isNaN(val)) return;
    const { snapshots, newHead } = recordLLAppend(llHead, val);
    llHead = newHead;
    ctrl.load(snapshots);
    $('resultChip').textContent = `append(${val}) 완료`;
  } else if (currentAlgo === 'prepend') {
    if (!raw) return;
    const val = parseInt(raw);
    if (isNaN(val)) return;
    const { snapshots, newHead } = recordLLPrepend(llHead, val);
    llHead = newHead;
    ctrl.load(snapshots);
    $('resultChip').textContent = `prepend(${val}) 완료`;
  } else if (currentAlgo === 'delete') {
    if (!raw) return;
    const val = parseInt(raw);
    if (isNaN(val)) return;
    const { snapshots, newHead } = recordLLDelete(llHead, val);
    llHead = newHead;
    ctrl.load(snapshots);
    $('resultChip').textContent = `delete(${val}) 완료`;
  } else if (currentAlgo === 'search') {
    if (!raw) return;
    const val = parseInt(raw);
    if (isNaN(val)) return;
    const { snapshots } = recordLLSearch(llHead, val);
    ctrl.load(snapshots);
    $('resultChip').textContent = `search(${val}) 실행 중...`;
  }

  $('valueInput').value = '';
}

$('actionBtn').addEventListener('click', runAction);
$('valueInput').addEventListener('keydown', e => { if (e.key === 'Enter') runAction(); });
$('clearBtn').addEventListener('click', () => {
  llHead = null;
  showCurrentState();
  $('stepDesc').textContent   = '초기화됨';
  $('resultChip').textContent = '—';
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

// Demo list
llHead = buildLL([10, 20, 30, 40]);
updateInfoPanel('append');
updatePseudo(-1);
setTimeout(() => { resizeCanvas(); showCurrentState(); $('stepDesc').textContent = '데모 리스트 로드 완료. 값을 입력하고 ▶를 눌러보세요!'; }, 50);
