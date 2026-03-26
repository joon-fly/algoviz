import { StepController } from '../common/StepController.js';
import { recordInsert, recordSearch, recordDelete,
         buildInitialBST, drawBST, inOrderValues } from './bst.js';

// ── Metadata ──────────────────────────────────────────────────────
const META = {
  insert: {
    opName: 'BST 삽입', avg:'O(log n)', worst:'O(n)',
    desc: '루트부터 값을 비교하며 올바른 위치를 찾아 삽입합니다. 균형 잡힌 트리에서 O(log n), 편향된 트리에서는 O(n)이 됩니다.',
    tags:['메모리 O(n)','재귀/반복 구현'],
    tagColors:['av-badge--purple','av-badge--yellow'],
  },
  search: {
    opName: 'BST 탐색', avg:'O(log n)', worst:'O(n)',
    desc: 'BST 속성을 이용해 값이 현재 노드보다 작으면 왼쪽, 크면 오른쪽으로 이동하며 탐색합니다.',
    tags:['메모리 O(log n)','BST 속성 활용'],
    tagColors:['av-badge--purple','av-badge--green'],
  },
  delete: {
    opName: 'BST 삭제', avg:'O(log n)', worst:'O(n)',
    desc: '삭제 케이스: ① 리프 노드 → 바로 제거 ② 자식 1개 → 자식으로 대체 ③ 자식 2개 → 중위 후계자(in-order successor)로 대체.',
    tags:['메모리 O(log n)','3가지 케이스'],
    tagColors:['av-badge--purple','av-badge--yellow'],
  },
};

const PSEUDO = {
  insert: ['insert(root, val):','  if root == null:','    return new Node(val)','  if val < root.val:','    root.left = insert(root.left, val)','  elif val > root.val:','    root.right = insert(root.right, val)','  else: // 중복','    return root  // 삽입 생략'],
  search: ['search(root, val):','  if root == null: return null','  if val == root.val:','    return root  // 발견','  elif val < root.val:','    return search(root.left, val)','  else:','    return search(root.right, val)'],
  delete: ['delete(root, val):','  // 대상 노드 탐색','  if val < root.val: go left','  if val > root.val: go right','  // 삭제 케이스','  if leaf: remove','  if one child: replace with child','  if two children:','    succ = inOrderSuccessor','    root.val = succ.val; delete succ'],
};

const SPEEDS = [700,280,110,35,6];
const SPEED_LABELS = ['매우 느림','느림','중간','빠름','매우 빠름'];

// ── State ─────────────────────────────────────────────────────────
let currentAlgo = 'insert';
let bstRoot     = null;

// ── DOM ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvasWrap = $('canvasWrap');
const canvas     = $('treeCanvas');
const ctx        = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = canvasWrap.clientWidth;
  canvas.height = canvasWrap.clientHeight;
}

// ── StepController ────────────────────────────────────────────────
const ctrl = new StepController({
  onStep(s, idx) {
    drawBST(ctx, canvas.width, canvas.height, s);
    $('stepCur').textContent = idx + 1;
    $('stepDesc').textContent = s.desc;
    updatePseudo(s.hlLine);
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
ctrl.bindButtons();
ctrl.bindKeys();

// ── Helpers ───────────────────────────────────────────────────────
function treeHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

function countNodes(node) {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function updateTreeStats() {
  $('nodeCount').textContent = countNodes(bstRoot);
  $('treeHeight').textContent = treeHeight(bstRoot);
  const vals = inOrderValues(bstRoot);
  $('treeValues').innerHTML = `중위 순서: <span>${vals.length ? vals.join(', ') : '—'}</span>`;
}

function updateInfoPanel(algo) {
  const m = META[algo];
  $('algoDesc').textContent  = m.desc;
  $('opName').textContent    = m.opName;
  $('tcAvg').textContent     = m.avg;
  $('tcWorst').textContent   = m.worst;
  $('metaRow').innerHTML = m.tags.map((t,i) =>
    `<span class="av-badge ${m.tagColors[i]}">${t}</span>`
  ).join('');
}

function updatePseudo(hl) {
  $('pseudoCode').innerHTML = PSEUDO[currentAlgo].map((l,i) =>
    i===hl ? `<span class="hl">${l}</span>` : l
  ).join('\n');
}

function showCurrentTree() {
  // Draw current state without steps
  const W=canvas.width, H=canvas.height;
  drawBST(ctx, W, H, bstRoot
    ? { nodes: getLayout(bstRoot,W,H), edges: getEdges(bstRoot), highlights:{}, hlLine:-1, desc:'' }
    : { nodes:[], edges:[], highlights:{}, hlLine:-1, desc:'' }
  );
}

// Layout helpers for showCurrentTree
function getLayout(root, W, H) {
  if (!root) return [];
  const nodes = [];
  let rank=0;
  function inOrder(n) { if(!n)return; inOrder(n.left); n._rank=rank++; nodes.push(n); inOrder(n.right); }
  inOrder(root);
  const n=nodes.length, PAD_X=40, PAD_Y=60;
  const usableW=W-PAD_X*2, usableH=H-PAD_Y*2;
  function depth(node,d=0){if(!node)return d-1;return Math.max(depth(node.left,d+1),depth(node.right,d+1));}
  const maxD=depth(root);
  function axy(node,d=0){if(!node)return;node._x=PAD_X+(n>1?node._rank/(n-1)*usableW:usableW/2);node._y=PAD_Y+(maxD>0?d/maxD*usableH:usableH/2);axy(node.left,d+1);axy(node.right,d+1);}
  axy(root);
  return nodes.map(n=>({id:n.id,value:n.value,x:n._x,y:n._y,leftId:n.left?.id??null,rightId:n.right?.id??null}));
}

function getEdges(root) {
  const edges=[];
  function walk(n){if(!n)return;if(n.left){edges.push({parentId:n.id,childId:n.left.id});walk(n.left);}if(n.right){edges.push({parentId:n.id,childId:n.right.id});walk(n.right);}}
  walk(root);
  return edges;
}

// ── Actions ───────────────────────────────────────────────────────
function runAction() {
  const rawVal = $('valueInput').value.trim();
  if (!rawVal) return;
  const value = parseInt(rawVal);
  if (isNaN(value)) return;

  resizeCanvas();
  const W=canvas.width, H=canvas.height;

  if (currentAlgo==='insert') {
    const { snapshots, newRoot } = recordInsert(bstRoot, value, W, H);
    bstRoot = newRoot;
    ctrl.load(snapshots);
  } else if (currentAlgo==='search') {
    const snaps = recordSearch(bstRoot, value, W, H);
    ctrl.load(snaps);
  } else if (currentAlgo==='delete') {
    if (!bstRoot) { $('stepDesc').textContent = '트리가 비어있습니다.'; return; }
    const { snapshots, newRoot } = recordDelete(bstRoot, value, W, H);
    bstRoot = newRoot;
    ctrl.load(snapshots);
  }

  updateTreeStats();
  $('valueInput').value = '';
}

// ── Events ────────────────────────────────────────────────────────
$('actionBtn').addEventListener('click', runAction);
$('valueInput').addEventListener('keydown', e => { if (e.key==='Enter') runAction(); });

$('randomBtn').addEventListener('click', () => {
  const val = Math.floor(Math.random()*90)+10;
  $('valueInput').value = val;
  runAction();
});

$('clearBtn').addEventListener('click', () => {
  bstRoot = null;
  ctrl.load([{ nodes:[], edges:[], highlights:{}, hlLine:-1, desc:'트리 초기화됨' }]);
  updateTreeStats();
  drawBST(ctx, canvas.width, canvas.height, { nodes:[], edges:[], highlights:{}, hlLine:-1, desc:'' });
});

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
  updatePseudo(-1);
  showCurrentTree();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  showCurrentTree();
});

// ── Boot ──────────────────────────────────────────────────────────
updateInfoPanel('insert');
updatePseudo(-1);

// Pre-load a small demo tree
setTimeout(() => {
  resizeCanvas();
  const demoValues = [50, 30, 70, 20, 40, 60, 80];
  bstRoot = buildInitialBST(demoValues);
  updateTreeStats();
  showCurrentTree();
  $('stepDesc').textContent = '데모 트리가 로드되었습니다. 값을 입력해보세요!';
}, 50);
