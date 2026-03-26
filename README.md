# algo.viz

**알고리즘 & 자료구조 단계별 시각화 학습 도구**

> 복잡한 알고리즘을 한 스텝씩 따라가며 이해할 수 있는 인터랙티브 시각화 프로젝트입니다.  
> 별도 설치 없이 브라우저에서 바로 실행됩니다.

🔗 **[algo.viz 바로가기](https://joon-fly.github.io/algoviz/)**

---

## ✨ 주요 기능

- **스냅샷 기반 스텝 제어** — ⏮ ◀ ▶ ▶| ⏭ 버튼 또는 `←` `→` `Space` 키로 앞뒤 자유롭게 이동
- **알고리즘 설명 패널** — 각 알고리즘의 한글 설명, 시간복잡도(최선/평균/최악), 안정성, 메모리 표시
- **의사코드 하이라이팅** — 현재 실행 중인 줄을 실시간으로 강조
- **재생 속도 조절** — 매우 느림 ~ 매우 빠름 5단계

---

## 📦 구현 목록

### 📊 정렬 알고리즘
| 알고리즘 | 최선 | 평균 | 최악 | 안정성 |
|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | ✓ 안정 |
| Selection Sort | O(n²) | O(n²) | O(n²) | ✗ 불안정 |
| Insertion Sort | O(n) | O(n²) | O(n²) | ✓ 안정 |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | ✓ 안정 |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | ✗ 불안정 |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | ✗ 불안정 |

> Merge Sort는 임시 배열(Auxiliary Space) 시각화 패널이 별도로 제공됩니다.

### 🔍 그래프 탐색
| 알고리즘 | 설명 | 자료구조 |
|---|---|---|
| BFS | 너비 우선 탐색 — 최단 거리(hop) 보장 | Queue |
| DFS | 깊이 우선 탐색 — 경로/사이클 탐색 | Stack |
| Dijkstra | 가중치 그래프 최단 경로 | Priority Queue |
| A* | 휴리스틱 기반 단일 목표 최단 경로 | Open Set (f = g + h) |

### 🌳 트리
| 알고리즘 | 연산 |
|---|---|
| Binary Search Tree | 삽입 / 탐색 / 삭제 (3가지 케이스) |

### 📚 자료구조 조작
| 자료구조 | 연산 |
|---|---|
| Stack | push / pop / peek |
| Queue | enqueue / dequeue / peek |
| Linked List | append / prepend / delete / search |

---

## 🎮 사용법

### 스텝 제어
```
⏮  — 처음으로
◀  — 이전 스텝
▶  — 재생 / 일시정지
▶| — 다음 스텝
⏭  — 끝으로

키보드: ← → Space Home End
```

### 정렬 알고리즘
1. 왼쪽 사이드바에서 알고리즘 선택
2. 배열 크기 / 재생 속도 슬라이더 조정
3. **새 배열** 버튼으로 랜덤 배열 생성 → 자동으로 스냅샷 계산
4. ▶ 재생 또는 스텝 버튼으로 단계별 확인

### 그래프 탐색
1. 알고리즘 선택 (BFS/DFS 또는 Dijkstra/A*)
2. **새 그래프** 버튼으로 랜덤 그래프 생성
3. A*는 목표 노드를 직접 선택 가능

### BST
1. **트리 초기 구성** 칸에서 값을 추가해 트리를 만들거나 **랜덤 추가** 클릭
2. 삽입 / 탐색 / 삭제 탭 선택
3. **연산 실행** 칸에 값을 입력하고 버튼 클릭

### 자료구조
1. 연산 탭 선택 (push, pop, enqueue 등)
2. 값을 입력하고 **실행 버튼** 클릭 또는 `Enter`

---

## 🗂️ 프로젝트 구조

```
algo-viz/
├── index.html                  # 메인 허브
├── sort.html                   # 정렬 6종
├── graph-traversal.html        # BFS / DFS
├── graph-pathfinding.html      # Dijkstra / A*
├── tree.html                   # BST
├── stack.html                  # Stack
├── queue.html                  # Queue
├── linkedlist.html             # Linked List
└── src/
    ├── common/
    │   ├── styles.css          # 공통 스타일
    │   └── StepController.js   # 스냅샷 재생 공통 모듈
    ├── sort/
    │   ├── algorithms.js       # 6종 알고리즘 스냅샷 레코더
    │   └── main.js
    ├── graph/
    │   ├── algorithms.js       # BFS/DFS/Dijkstra/A* 레코더
    │   ├── renderer.js         # Canvas 렌더러 + 그래프 생성
    │   ├── traversal.js        # BFS/DFS 진입점
    │   └── pathfinding.js      # Dijkstra/A* 진입점
    ├── tree/
    │   ├── bst.js              # BST 연산 + 렌더러
    │   └── main.js
    └── ds/
        ├── algorithms.js       # Stack/Queue/LinkedList 레코더
        ├── renderer.js         # 자료구조 Canvas 렌더러
        ├── stack.js
        ├── queue.js
        └── linkedlist.js
```

---

## 🛠️ 기술 스택

- **Vanilla JS** (ES Modules) — 프레임워크 없이 순수 JS
- **HTML5 Canvas** — 그래프, 트리, 자료구조 렌더링
- **CSS3** — 공통 디자인 시스템 (`styles.css`)
- **GitHub Pages** — 빌드 없이 정적 파일 직접 배포

---

## 🚧 준비 중

- AVL Tree (자가 균형 이진 트리 · 회전 시각화)
- Doubly Linked List
- 경로 탐색 그리드 맵 (Dijkstra / A* 시각화 강화)

---

## 📄 라이선스

MIT License
