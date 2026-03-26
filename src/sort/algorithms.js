// ── Sort algorithm snapshot recorders ───────────────────────────
// Each returns an array of snapshot objects:
// { array, colors, auxArray, auxColors, comparisons, swaps, hlLine, desc }

function snap(arr, colors, comp, swp, hl, desc, auxArr, auxC) {
  return {
    array:      arr.slice(),
    colors:     colors.slice(),
    comparisons: comp,
    swaps:      swp,
    hlLine:     hl ?? -1,
    desc:       desc || '',
    auxArray:   auxArr ? auxArr.slice() : null,
    auxColors:  auxC   ? auxC.slice()   : null,
  };
}

// ── Bubble ───────────────────────────────────────────────────────
export function recordBubble(arr) {
  const S=[], a=arr.slice(), n=a.length, c=Array(n).fill('');
  let cp=0, sw=0;
  S.push(snap(a,c,cp,sw,-1,'시작'));
  for (let i=0; i<n-1; i++) {
    for (let j=0; j<n-i-1; j++) {
      const nc=c.slice(); nc[j]='active'; nc[j+1]='compare'; cp++;
      S.push(snap(a,nc,cp,sw,2,`[${j}]=${a[j]} vs [${j+1}]=${a[j+1]}`));
      if (a[j]>a[j+1]) {
        [a[j],a[j+1]]=[a[j+1],a[j]]; sw++;
        const sc=c.slice(); sc[j]='active'; sc[j+1]='active';
        S.push(snap(a,sc,cp,sw,3,`swap → [${j}]=${a[j]}, [${j+1}]=${a[j+1]}`));
      }
    }
    c[n-1-i]='sorted';
    S.push(snap(a,c,cp,sw,0,`패스 ${i+1} 완료`));
  }
  c[0]='sorted';
  S.push(snap(a,c,cp,sw,-1,'정렬 완료 ✓'));
  return S;
}

// ── Selection ────────────────────────────────────────────────────
export function recordSelection(arr) {
  const S=[], a=arr.slice(), n=a.length, c=Array(n).fill('');
  let cp=0, sw=0;
  S.push(snap(a,c,cp,sw,-1,'시작'));
  for (let i=0; i<n-1; i++) {
    let mi=i; c[i]='active';
    S.push(snap(a,c,cp,sw,1,`i=${i}, 최솟값 후보=${a[i]}`));
    for (let j=i+1; j<n; j++) {
      const p=c.slice(); p[j]='compare'; cp++;
      S.push(snap(a,p,cp,sw,3,`[${j}]=${a[j]} vs 최솟값=${a[mi]}`));
      if (a[j]<a[mi]) {
        if (mi!==i) c[mi]=''; mi=j; c[mi]='pivot';
        S.push(snap(a,c,cp,sw,4,`새 최솟값 [${j}]=${a[j]}`));
      } else { c[j]=''; }
    }
    if (mi!==i) { [a[i],a[mi]]=[a[mi],a[i]]; sw++; }
    c[i]='sorted'; if (mi!==i) c[mi]='';
    S.push(snap(a,c,cp,sw,5,`[${i}]=${a[i]} 위치 확정`));
  }
  c[n-1]='sorted';
  S.push(snap(a,c,cp,sw,-1,'정렬 완료 ✓'));
  return S;
}

// ── Insertion ────────────────────────────────────────────────────
export function recordInsertion(arr) {
  const S=[], a=arr.slice(), n=a.length, c=Array(n).fill('');
  let cp=0, sw=0;
  c[0]='sorted';
  S.push(snap(a,c,cp,sw,-1,'시작'));
  for (let i=1; i<n; i++) {
    const key=a[i]; let j=i-1; c[i]='active';
    S.push(snap(a,c,cp,sw,0,`key = [${i}] = ${key}`));
    while (j>=0 && a[j]>key) {
      c[j]='compare'; cp++;
      S.push(snap(a,c,cp,sw,2,`[${j}]=${a[j]} > key=${key}`));
      a[j+1]=a[j]; sw++; c[j+1]='sorted'; c[j]='';
      S.push(snap(a,c,cp,sw,3,`[${j+1}] ← [${j}]`));
      j--;
    }
    a[j+1]=key; c[j+1]='sorted'; c[i]='sorted';
    S.push(snap(a,c,cp,sw,4,`[${j+1}] ← key=${key} 삽입`));
  }
  S.push(snap(a,c,cp,sw,-1,'정렬 완료 ✓'));
  return S;
}

// ── Merge ────────────────────────────────────────────────────────
export function recordMerge(arr) {
  const S=[], a=arr.slice(), n=a.length, c=Array(n).fill('');
  const aux=Array(n).fill(0), auxC=Array(n).fill('');
  let cp=0, sw=0;

  const s=(hl,desc)=>S.push(snap(a,c,cp,sw,hl,desc,aux,auxC));

  s(-1,'시작');

  function ms(l,r) {
    if (l>=r) { c[l]='sorted'; s(1,`기저: [${l}]=${a[l]}`); return; }
    const mid=Math.floor((l+r)/2);
    for (let k=l;k<=r;k++) c[k]='merge-range';
    s(2,`분할 [${l}..${mid}] | [${mid+1}..${r}]`);
    ms(l,mid); ms(mid+1,r);

    for (let k=0;k<n;k++) { aux[k]=0; auxC[k]=''; }
    for (let k=l;k<=mid;k++) { aux[k]=a[k]; auxC[k]='aux-left'; }
    s(5,`왼쪽 절반 복사 → 임시배열[${l}..${mid}]`);
    for (let k=mid+1;k<=r;k++) { aux[k]=a[k]; auxC[k]='aux-right'; }
    s(6,`오른쪽 절반 복사 → 임시배열[${mid+1}..${r}]`);

    let i=l, j=mid+1, k=l;
    while (i<=mid && j<=r) {
      const t=auxC.slice(); t[i]='aux-left'; t[j]='aux-right'; cp++;
      S.push(snap(a,c,cp,sw,8,`비교 임시[${i}]=${aux[i]} vs 임시[${j}]=${aux[j]}`,aux,t));
      if (aux[i]<=aux[j]) {
        a[k]=aux[i]; const p=auxC.slice(); p[i]='aux-placing'; c[k]='active';
        S.push(snap(a,c,cp,sw,9,`arr[${k}] ← ${aux[i]} (왼쪽 선택)`,aux,p)); i++;
      } else {
        a[k]=aux[j]; sw++; const p=auxC.slice(); p[j]='aux-placing'; c[k]='active';
        S.push(snap(a,c,cp,sw,9,`arr[${k}] ← ${aux[j]} (오른쪽 선택)`,aux,p)); j++;
      }
      k++;
    }
    while (i<=mid) { a[k]=aux[i]; c[k]='active'; i++; k++; }
    while (j<=r)   { a[k]=aux[j]; c[k]='active'; j++; k++; }
    for (let x=l;x<=r;x++) c[x]='sorted';
    const ca=aux.slice(), cc=auxC.slice();
    for (let x=l;x<=r;x++) { ca[x]=0; cc[x]=''; }
    S.push(snap(a,c,cp,sw,-1,`병합 완료 [${l}..${r}]`,ca,cc));
    for (let x=l;x<=r;x++) { aux[x]=0; auxC[x]=''; }
  }

  ms(0,n-1);
  S.push(snap(a,c,cp,sw,-1,'정렬 완료 ✓',Array(n).fill(0),Array(n).fill('')));
  return S;
}

// ── Quick ────────────────────────────────────────────────────────
export function recordQuick(arr) {
  const S=[], a=arr.slice(), n=a.length, c=Array(n).fill('');
  let cp=0, sw=0;
  const s=(hl,desc)=>S.push(snap(a,c,cp,sw,hl,desc));
  s(-1,'시작');
  function part(lo,hi) {
    const piv=a[hi]; c[hi]='pivot'; s(2,`pivot=${piv}`);
    let i=lo-1;
    for (let j=lo; j<hi; j++) {
      c[j]='compare'; cp++; s(5,`[${j}]=${a[j]} vs pivot=${piv}`);
      if (a[j]<=piv) {
        i++; [a[i],a[j]]=[a[j],a[i]]; sw++;
        c[i]='active'; s(6,`swap [${i}]↔[${j}]`); c[i]='';
      }
      c[j]='';
    }
    [a[i+1],a[hi]]=[a[hi],a[i+1]]; sw++;
    c[hi]=''; c[i+1]='sorted';
    s(7,`pivot ${piv} → 위치 ${i+1} 확정`);
    return i+1;
  }
  function qs(lo,hi) {
    if (lo>hi) return;
    if (lo===hi) { c[lo]='sorted'; s(1,`단일 [${lo}]=${a[lo]}`); return; }
    s(0,`quickSort([${lo}..${hi}])`);
    const pi=part(lo,hi); qs(lo,pi-1); qs(pi+1,hi);
  }
  qs(0,n-1); s(-1,'정렬 완료 ✓');
  return S;
}

// ── Heap ─────────────────────────────────────────────────────────
export function recordHeap(arr) {
  const S=[], a=arr.slice(), n=a.length, c=Array(n).fill('');
  let cp=0, sw=0;
  const s=(hl,desc)=>S.push(snap(a,c,cp,sw,hl,desc));
  s(-1,'시작');
  function heapify(size,i) {
    let lg=i, l=2*i+1, r=2*i+2; c[i]='active';
    if (l<size) { cp++; if (a[l]>a[lg]) lg=l; }
    if (r<size) { cp++; if (a[r]>a[lg]) lg=r; }
    s(5,`heapify(${i}): largest=${lg}`);
    if (lg!==i) {
      [a[i],a[lg]]=[a[lg],a[i]]; sw++;
      c[i]=''; c[lg]='compare'; s(9,`swap [${i}]↔[${lg}]`); c[lg]='';
      heapify(size,lg);
    } else { c[i]=''; }
  }
  s(0,'Max Heap 구성');
  for (let i=Math.floor(n/2)-1; i>=0; i--) heapify(n,i);
  s(0,'Max Heap 완료');
  for (let i=n-1; i>0; i--) {
    [a[0],a[i]]=[a[i],a[0]]; sw++; c[i]='sorted';
    s(2,`[0]↔[${i}], 위치 ${i} 확정`); heapify(i,0);
  }
  c[0]='sorted'; s(-1,'정렬 완료 ✓');
  return S;
}
