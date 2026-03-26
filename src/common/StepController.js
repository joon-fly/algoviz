// ── StepController ───────────────────────────────────────────────
// Manages snapshot navigation + auto-play for any viz page.
// Usage:
//   const ctrl = new StepController({ onStep, onStatus })
//   ctrl.load(snapshots)
//   ctrl.bindKeys()

export class StepController {
  constructor({ onStep, onStatus }) {
    this._onStep   = onStep;   // (snapshot, idx, total) => void
    this._onStatus = onStatus; // (statusStr) => void
    this._snaps    = [];
    this._idx      = 0;
    this._timer    = null;
    this._playing  = false;
    this._delay    = 110;

    // DOM refs — caller must set these before calling load()
    this.elFirst = null;
    this.elPrev  = null;
    this.elPlay  = null;
    this.elNext  = null;
    this.elLast  = null;
    this.elCur   = null;
    this.elTotal = null;
  }

  // ── Public API ────────────────────────────────────────────────

  load(snapshots) {
    this._stop();
    this._snaps = snapshots;
    this._idx   = 0;
    if (this.elTotal) this.elTotal.textContent = snapshots.length;
    this._apply(0);
    this._setStatus('stepping');
  }

  setDelay(ms) {
    this._delay = ms;
    if (this._playing) { this._stop(); this._play(); }
  }

  goTo(idx) {
    this._stop();
    this._move(idx);
    this._setStatus(this._atEnd() ? 'done' : 'stepping');
  }

  toggle() {
    if (!this._snaps.length) return;
    this._playing ? (this._stop(), this._setStatus(this._atEnd() ? 'done' : 'stepping'))
                  : this._play();
  }

  bindKeys() {
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') this.goTo(this._idx + 1);
      if (e.key === 'ArrowLeft')  this.goTo(this._idx - 1);
      if (e.key === ' ')          { e.preventDefault(); this.toggle(); }
      if (e.key === 'Home')       this.goTo(0);
      if (e.key === 'End')        this.goTo(this._snaps.length - 1);
    });
  }

  bindButtons() {
    this.elFirst?.addEventListener('click', () => this.goTo(0));
    this.elPrev ?.addEventListener('click', () => this.goTo(this._idx - 1));
    this.elNext ?.addEventListener('click', () => this.goTo(this._idx + 1));
    this.elLast ?.addEventListener('click', () => this.goTo(this._snaps.length - 1));
    this.elPlay ?.addEventListener('click', () => this.toggle());
  }

  // ── Private ───────────────────────────────────────────────────

  _apply(idx) {
    this._idx = idx;
    const s = this._snaps[idx];
    if (this.elCur) this.elCur.textContent = idx + 1;
    this._updateBtns();
    this._onStep(s, idx, this._snaps.length);
  }

  _move(idx) {
    this._apply(Math.max(0, Math.min(this._snaps.length - 1, idx)));
  }

  _play() {
    if (this._atEnd()) this._apply(0);
    this._playing = true;
    if (this.elPlay) this.elPlay.textContent = '⏸';
    this._setStatus('playing');
    this._timer = setInterval(() => {
      if (this._atEnd()) { this._stop(); this._setStatus('done'); return; }
      this._apply(this._idx + 1);
    }, this._delay);
  }

  _stop() {
    this._playing = false;
    clearInterval(this._timer);
    this._timer = null;
    if (this.elPlay) this.elPlay.textContent = '▶';
    this._updateBtns();
  }

  _atEnd()   { return this._idx >= this._snaps.length - 1; }
  _atStart() { return this._idx === 0; }

  _updateBtns() {
    if (this.elFirst) this.elFirst.disabled = this._atStart();
    if (this.elPrev)  this.elPrev.disabled  = this._atStart();
    if (this.elNext)  this.elNext.disabled  = this._atEnd();
    if (this.elLast)  this.elLast.disabled  = this._atEnd();
    if (this.elPlay)  this.elPlay.disabled  = this._snaps.length === 0;
  }

  _setStatus(s) {
    const labels = { idle: 'IDLE', stepping: 'STEP', playing: 'PLAY', done: 'DONE ✓' };
    this._onStatus(s, labels[s] || s);
  }
}
