import { StepController } from '../common/StepController.js';
import { recordBubble, recordSelection, recordInsertion,
         recordMerge, recordQuick, recordHeap } from './algorithms.js';

// ── Metadata ──────────────────────────────────────────────────────
const META = {
  bubble:    { name:'Bubble Sort',    best:'O(n)',      avg:'O(n²)',      worst:'O(n²)',      space:'O(1)',      stable:true,  hasAux:false,
    desc:'인접한 두 원소를 반복 비교하여 큰 값을 오른쪽으로 밀어냅니다. 구현이 가장 단순하지만 실용적으로는 거의 사용되지 않습니다. 이미 정렬된 배열에서는 O(n)으로 동작합니다.' },
  selection: { name:'Selection Sort', best:'O(n²)',     avg:'O(n²)',      worst:'O(n²)',      space:'O(1)',      stable:false, hasAux:false,
    desc:'매 패스마다 미정렬 구간의 최솟값을 찾아 앞으로 가져옵니다. 교환 횟수가 O(n)으로 적지만 비교 횟수는 항상 O(n²)입니다.' },
  insertion: { name:'Insertion Sort', best:'O(n)',      avg:'O(n²)',      worst:'O(n²)',      space:'O(1)',      stable:true,  hasAux:false,
    desc:'정렬된 구간을 유지하며 새 원소를 적절한 위치에 삽입합니다. 거의 정렬된 데이터에서 매우 빠르며, 소규모 데이터에 유리합니다.' },
  merge:     { name:'Merge Sort',     best:'O(n log n)',avg:'O(n log n)', worst:'O(n log n)', space:'O(n)',      stable:true,  hasAux:true,
    desc:'분할 정복으로 배열을 반으로 나눈 뒤 병합합니다. 항상 O(n log n)을 보장하며 안정 정렬입니다. 병합 시 O(n) 추가 메모리가 필요합니다.' },
  quick:     { name:'Quick Sort',     best:'O(n log n)',avg:'O(n log n)', worst:'O(n²)',      space:'O(log n)', stable:false, hasAux:false,
    desc:'피벗을 기준으로 작은 값·큰 값으로 분할하는 분할 정복 알고리즘입니다. 평균적으로 가장 빠르지만 피벗 선택이 나쁘면 O(n²)이 될 수 있습니다.' },
  heap:      { name:'Heap Sort',      best:'O(n log n)',avg:'O(n log n)', worst:'O(n log n)', space:'O(1)',      stable:false, hasAux:false,
    desc:'최대 힙 자료구조를 이용해 정렬합니다. 항상 O(n log n)을 보장하고 추가 메모리가 없지만, 캐시 지역성이 낮아 Quick Sort보다 실제 성능은 느릴 수 있습니다.' },
};

const PSEUDO = {
  bubble:    ['for i = 0 to n-1:','  for j = 0 to n-i-2:','    if arr[j] > arr[j+1]:','      swap(arr[j], arr[j+1])'],
  selection: ['for i = 0 to n-1:','  minIdx = i','  for j = i+1 to n:','    if arr[j] < arr[minIdx]:','      minIdx = j','  swap(arr[i], arr[minIdx])'],
  insertion: ['for i = 1 to n:','  key = arr[i]; j = i-1','  while j >= 0 and arr[j] > key:','    arr[j+1] = arr[j]; j--','  arr[j+1] = key'],
  merge:     ['mergeSort(arr, l, r):','  if l >= r: return','  mid = (l+r)/2','  mergeSort(arr, l, mid)','  mergeSort(arr, mid+1, r)','  left[] = arr[l..mid]','  right[] = arr[mid+1..r]','  i=0; j=0; k=l','  while i<|L| and j<|R|:','    place min(L[i],R[j]) → arr[k]'],
  quick:     ['quickSort(arr, low, high):','  if low >= high: return','  pivot = arr[high]','  i = low - 1','  for j = low to high-1:','    if arr[j] <= pivot:','      i++; swap(arr[i], arr[j])','  swap(arr[i+1], arr[high])','  quickSort(arr, low, pi-1)','  quickSort(arr, pi+1, high)'],
  heap:      ['buildMaxHeap(arr)','for i = n-1 downto 1:','  swap(arr[0], arr[i])','  heapify(arr, i, 0)','heapify(arr, n, i):','  l=2i+1; r=2i+2; largest=i','  if arr[l]>arr[largest]: largest=l','  if arr[r]>arr[largest]: largest=r','  if largest != i:','    swap; heapify(arr,n,largest)'],
};

const SPEEDS = [700,280,110,35,6];
const SPEED_LABELS = ['매우 느림','느림','중간','빠름','매우 빠름'];
const RECORDERS = { bubble:recordBubble, selection:recordSelection, insertion:recordInsertion,
                    merge:recordMerge, quick:recordQuick, heap:recordHeap };

// ── State ─────────────────────────────────────────────────────────
let currentAlgo = 'bubble';
let baseArray   = [];

// ── DOM ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const ctrl = new StepController({
  onStep(s, idx) {
    applySnapshot(s);
    $('stepCur').textContent = idx + 1;
    $('stepDesc').textContent = s.desc;
  },
  onStatus(key, label) {
    const el = $('statusBadge');
    el.className = `av-status av-status--${key}`;
    el.textContent = label;
  },
});

ctrl.elFirst = $('firstBtn'); ctrl.elPrev = $('prevBtn');
ctrl.elPlay  = $('playBtn');  ctrl.elNext = $('nextBtn');
ctrl.elLast  = $('lastBtn');  ctrl.elCur  = $('stepCur');
ctrl.elTotal = $('stepTot');
ctrl.bindButtons();
ctrl.bindKeys();

// ── Render ────────────────────────────────────────────────────────
function buildBarEls() {
  $('vizArea').innerHTML = ''; $('auxBars').innerHTML = '';
  baseArray.forEach(() => {
    const b = document.createElement('div'); b.className='bar'; $('vizArea').appendChild(b);
    const ab = document.createElement('div'); ab.className='aux-bar'; $('auxBars').appendChild(ab);
  });
}

function applySnapshot(s) {
  const bars    = $('vizArea').querySelectorAll('.bar');
  const auxBars = $('auxBars').querySelectorAll('.aux-bar');
  const maxV = Math.max(...s.array);
  const auxMax = s.auxArray ? Math.max(...s.auxArray.filter(v=>v>0), 1) : 1;

  bars.forEach((b,i) => {
    b.style.height = (s.array[i]/maxV*95)+'%';
    b.className = 'bar'+(s.colors[i]?' '+s.colors[i]:'');
  });

  if (s.auxArray) {
    auxBars.forEach((b,i) => {
      const v=s.auxArray[i];
      b.style.height = v>0 ? (v/auxMax*88)+'%' : '0%';
      b.className = 'aux-bar'+(s.auxColors?.[i]?' '+s.auxColors[i]:(v>0?' filled':''));
    });
  } else {
    auxBars.forEach(b => { b.style.height='0%'; b.className='aux-bar'; });
  }

  $('compCount').textContent = s.comparisons.toLocaleString();
  $('swapCount').textContent = s.swaps.toLocaleString();
  updatePseudo(s.hlLine);
}

function updatePseudo(hl) {
  $('pseudoCode').innerHTML = PSEUDO[currentAlgo].map((l,i) =>
    i===hl ? `<span class="hl">${l}</span>` : l
  ).join('\n');
}

function updateInfoPanel(algo) {
  const m = META[algo];
  $('algoDesc').textContent  = m.desc;
  $('tcBest').textContent    = m.best;
  $('tcAvg').textContent     = m.avg;
  $('tcWorst').textContent   = m.worst;
  $('algoName').textContent  = m.name;
  $('metaRow').innerHTML = `
    <span class="av-badge ${m.stable?'av-badge--green':'av-badge--red'}">${m.stable?'✓ 안정 정렬':'✗ 불안정 정렬'}</span>
    <span class="av-badge av-badge--purple">메모리 ${m.space}</span>`;
  $('auxPanel').classList.toggle('visible', m.hasAux);
}

// ── Generate ──────────────────────────────────────────────────────
function generate() {
  const n = parseInt($('sizeSlider').value);
  baseArray = Array.from({length:n}, ()=>Math.floor(Math.random()*85)+15);
  buildBarEls();
  ctrl.load(RECORDERS[currentAlgo](baseArray));
  updatePseudo(-1);
}

// ── Events ────────────────────────────────────────────────────────
$('generateBtn').addEventListener('click', generate);
$('resetBtn').addEventListener('click', () => ctrl.goTo(0));

$('sizeSlider').addEventListener('input',  () => $('sizeVal').textContent = $('sizeSlider').value);
$('sizeSlider').addEventListener('change', generate);

$('speedSlider').addEventListener('input', () => {
  const v = parseInt($('speedSlider').value)-1;
  $('speedVal').textContent = SPEED_LABELS[v];
  ctrl.setDelay(SPEEDS[v]);
});

$('algoList').addEventListener('click', e => {
  const btn = e.target.closest('.av-algo-btn'); if (!btn) return;
  document.querySelectorAll('.av-algo-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentAlgo = btn.dataset.algo;
  updateInfoPanel(currentAlgo);
  if (baseArray.length) { buildBarEls(); ctrl.load(RECORDERS[currentAlgo](baseArray)); }
});

// ── Boot ──────────────────────────────────────────────────────────
updateInfoPanel('bubble');
generate();
