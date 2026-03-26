// ── Data Structure snapshot recorders ───────────────────────────
// Each operation returns an array of snapshots describing the animation steps.
//
// Snapshot shape:
//   Stack/Queue: { items, highlights, hlLine, desc, pointerLabel }
//   LinkedList:  { nodes, highlights, hlLine, desc, arrows }
//
// highlights: { [index/id]: colorKey }
// colorKey: 'active' | 'new' | 'removed' | 'found' | 'muted'

// ── STACK ────────────────────────────────────────────────────────
export function recordPush(stack, value) {
  const S = [];
  const items = [...stack];

  S.push({ items: [...items], highlights: {}, hlLine: 0,
    desc: `push(${value}) 시작 — 스택 상단에 추가`, pointerLabel: `top → [${items.length - 1}]` });

  items.push(value);
  S.push({ items: [...items], highlights: { [items.length - 1]: 'new' }, hlLine: 1,
    desc: `${value} 를 스택 상단에 추가`, pointerLabel: `top → [${items.length - 1}]` });

  S.push({ items: [...items], highlights: {}, hlLine: -1,
    desc: `push(${value}) 완료 ✓  크기: ${items.length}`, pointerLabel: `top → [${items.length - 1}]` });

  return { snapshots: S, newState: items };
}

export function recordPop(stack) {
  const S = [];
  const items = [...stack];

  if (items.length === 0) {
    S.push({ items: [], highlights: {}, hlLine: 2,
      desc: '스택이 비어있습니다 — pop 불가 (underflow)', pointerLabel: 'top → (비어있음)' });
    return { snapshots: S, newState: items, popped: null };
  }

  S.push({ items: [...items], highlights: { [items.length - 1]: 'active' }, hlLine: 3,
    desc: `pop() 시작 — 상단 값 ${items[items.length - 1]} 를 꺼냄`, pointerLabel: `top → [${items.length - 1}]` });

  const popped = items.pop();
  S.push({ items: [...items], highlights: {}, hlLine: 4,
    desc: `${popped} 반환 완료 ✓  크기: ${items.length}`, pointerLabel: items.length ? `top → [${items.length - 1}]` : 'top → (비어있음)' });

  return { snapshots: S, newState: items, popped };
}

export function recordPeek(stack) {
  const S = [];
  const items = [...stack];

  if (items.length === 0) {
    S.push({ items: [], highlights: {}, hlLine: 2,
      desc: '스택이 비어있습니다 — peek 불가', pointerLabel: 'top → (비어있음)' });
    return { snapshots: S };
  }

  S.push({ items: [...items], highlights: { [items.length - 1]: 'found' }, hlLine: 5,
    desc: `peek() — 상단 값 ${items[items.length - 1]} 확인 (제거하지 않음)`, pointerLabel: `top → [${items.length - 1}]` });

  S.push({ items: [...items], highlights: {}, hlLine: -1,
    desc: `peek() = ${items[items.length - 1]} ✓`, pointerLabel: `top → [${items.length - 1}]` });

  return { snapshots: S };
}

// ── QUEUE ────────────────────────────────────────────────────────
export function recordEnqueue(queue, value) {
  const S = [];
  const items = [...queue];

  S.push({ items: [...items], highlights: {}, hlLine: 0,
    desc: `enqueue(${value}) 시작 — 큐 뒤쪽에 추가`, frontLabel: 'front → [0]', rearLabel: `rear → [${items.length - 1}]` });

  items.push(value);
  S.push({ items: [...items], highlights: { [items.length - 1]: 'new' }, hlLine: 1,
    desc: `${value} 를 rear에 추가`, frontLabel: 'front → [0]', rearLabel: `rear → [${items.length - 1}]` });

  S.push({ items: [...items], highlights: {}, hlLine: -1,
    desc: `enqueue(${value}) 완료 ✓  크기: ${items.length}`, frontLabel: 'front → [0]', rearLabel: `rear → [${items.length - 1}]` });

  return { snapshots: S, newState: items };
}

export function recordDequeue(queue) {
  const S = [];
  const items = [...queue];

  if (items.length === 0) {
    S.push({ items: [], highlights: {}, hlLine: 2,
      desc: '큐가 비어있습니다 — dequeue 불가 (underflow)', frontLabel: 'front → (비어있음)', rearLabel: '' });
    return { snapshots: S, newState: items, dequeued: null };
  }

  S.push({ items: [...items], highlights: { 0: 'active' }, hlLine: 3,
    desc: `dequeue() 시작 — front 값 ${items[0]} 를 꺼냄`, frontLabel: 'front → [0]', rearLabel: `rear → [${items.length - 1}]` });

  const dequeued = items.shift();
  S.push({ items: [...items], highlights: {}, hlLine: 4,
    desc: `${dequeued} 반환 완료 ✓  크기: ${items.length}`,
    frontLabel: items.length ? 'front → [0]' : 'front → (비어있음)',
    rearLabel: items.length ? `rear → [${items.length - 1}]` : '' });

  return { snapshots: S, newState: items, dequeued };
}

export function recordQueuePeek(queue) {
  const S = [];
  const items = [...queue];

  if (items.length === 0) {
    S.push({ items: [], highlights: {}, hlLine: 2,
      desc: '큐가 비어있습니다 — peek 불가', frontLabel: 'front → (비어있음)', rearLabel: '' });
    return { snapshots: S };
  }

  S.push({ items: [...items], highlights: { 0: 'found' }, hlLine: 5,
    desc: `peek() — front 값 ${items[0]} 확인 (제거하지 않음)`, frontLabel: 'front → [0]', rearLabel: `rear → [${items.length - 1}]` });

  S.push({ items: [...items], highlights: {}, hlLine: -1,
    desc: `peek() = ${items[0]} ✓`, frontLabel: 'front → [0]', rearLabel: `rear → [${items.length - 1}]` });

  return { snapshots: S };
}

// ── LINKED LIST ──────────────────────────────────────────────────
let _llUid = 0;

function mkNode(value) {
  return { id: _llUid++, value, next: null };
}

function cloneLL(head) {
  if (!head) return null;
  const newHead = { id: head.id, value: head.value, next: null };
  let src = head.next, dst = newHead;
  while (src) {
    dst.next = { id: src.id, value: src.value, next: null };
    dst = dst.next; src = src.next;
  }
  return newHead;
}

function llToArray(head) {
  const arr = [];
  let cur = head;
  while (cur) { arr.push({ id: cur.id, value: cur.value }); cur = cur.next; }
  return arr;
}

function snapLL(head, highlights, hlLine, desc) {
  return { nodes: llToArray(head), highlights: { ...highlights }, hlLine: hlLine ?? -1, desc: desc || '' };
}

export function recordLLAppend(head, value) {
  const S = [];
  let root = cloneLL(head);
  const hl = {};

  S.push(snapLL(root, {}, 0, `append(${value}) 시작`));

  const newNode = mkNode(value);

  if (!root) {
    root = newNode;
    S.push(snapLL(root, { [root.id]: 'new' }, 2, `리스트가 비어있음 → head = ${value}`));
    S.push(snapLL(root, {}, -1, `append(${value}) 완료 ✓`));
    return { snapshots: S, newHead: root };
  }

  let cur = root;
  hl[cur.id] = 'active';
  S.push(snapLL(root, { ...hl }, 3, `head 에서 시작 (${cur.value})`));

  while (cur.next) {
    hl[cur.id] = 'muted';
    cur = cur.next;
    hl[cur.id] = 'active';
    S.push(snapLL(root, { ...hl }, 4, `다음 노드로 이동: ${cur.value}`));
  }

  S.push(snapLL(root, { ...hl }, 5, `tail 발견: ${cur.value} → next = null`));

  cur.next = newNode;
  hl[cur.id] = 'muted';
  hl[newNode.id] = 'new';
  S.push(snapLL(root, { ...hl }, 6, `새 노드 ${value} 를 tail 뒤에 연결`));
  S.push(snapLL(root, {}, -1, `append(${value}) 완료 ✓`));

  return { snapshots: S, newHead: root };
}

export function recordLLPrepend(head, value) {
  const S = [];
  let root = cloneLL(head);

  S.push(snapLL(root, {}, 0, `prepend(${value}) 시작 — head 앞에 삽입`));

  const newNode = mkNode(value);
  newNode.next = root;
  root = newNode;

  S.push(snapLL(root, { [newNode.id]: 'new' }, 1, `새 노드 ${value} 생성, next → 기존 head`));
  S.push(snapLL(root, { [newNode.id]: 'new' }, 2, `head = 새 노드 ${value}`));
  S.push(snapLL(root, {}, -1, `prepend(${value}) 완료 ✓`));

  return { snapshots: S, newHead: root };
}

export function recordLLDelete(head, value) {
  const S = [];
  let root = cloneLL(head);
  const hl = {};

  S.push(snapLL(root, {}, 0, `delete(${value}) 시작 — 값 탐색`));

  if (!root) {
    S.push(snapLL(root, {}, -1, '리스트가 비어있습니다'));
    return { snapshots: S, newHead: root };
  }

  // Head is target
  if (root.value === value) {
    hl[root.id] = 'removed';
    S.push(snapLL(root, { ...hl }, 2, `head(${root.value}) 가 삭제 대상 — head = head.next`));
    root = root.next;
    S.push(snapLL(root, {}, -1, `delete(${value}) 완료 ✓`));
    return { snapshots: S, newHead: root };
  }

  let prev = root, cur = root.next;
  hl[prev.id] = 'active';
  S.push(snapLL(root, { ...hl }, 3, `${prev.value} 확인: 대상 아님, 계속`));

  while (cur) {
    hl[cur.id] = 'active';
    S.push(snapLL(root, { ...hl }, 4, `${cur.value} 확인`));

    if (cur.value === value) {
      hl[cur.id] = 'removed';
      S.push(snapLL(root, { ...hl }, 5, `${value} 발견 — prev.next = cur.next 로 연결`));
      prev.next = cur.next;
      S.push(snapLL(root, {}, -1, `delete(${value}) 완료 ✓`));
      return { snapshots: S, newHead: root };
    }

    hl[prev.id] = 'muted';
    prev = cur;
    cur = cur.next;
    hl[prev.id] = 'active';
  }

  S.push(snapLL(root, {}, 6, `${value} 를 찾지 못함 — 삭제 불가`));
  return { snapshots: S, newHead: root };
}

export function recordLLSearch(head, value) {
  const S = [];
  const root = cloneLL(head);
  const hl = {};
  let cur = root;
  let idx = 0;

  S.push(snapLL(root, {}, 0, `search(${value}) 시작`));

  while (cur) {
    hl[cur.id] = 'active';
    S.push(snapLL(root, { ...hl }, 2, `[${idx}] = ${cur.value} 확인`));

    if (cur.value === value) {
      hl[cur.id] = 'found';
      S.push(snapLL(root, { ...hl }, 3, `${value} 발견! 인덱스 ${idx} ✓`));
      return { snapshots: S };
    }

    hl[cur.id] = 'muted';
    cur = cur.next;
    idx++;
  }

  S.push(snapLL(root, {}, 4, `${value} 를 찾지 못함`));
  return { snapshots: S };
}

// Helper: build initial linked list from array
export function buildLL(values) {
  _llUid = 0;
  if (!values.length) return null;
  let head = mkNode(values[0]);
  let cur = head;
  for (let i = 1; i < values.length; i++) {
    cur.next = mkNode(values[i]);
    cur = cur.next;
  }
  return head;
}

export function llLength(head) {
  let n = 0, cur = head;
  while (cur) { n++; cur = cur.next; }
  return n;
}
