export class Timer {
  private timeout: NodeJS.Timeout | null = null;
  private _endsAt: number | null = null;

  get endsAt(): number | null {
    return this._endsAt;
  }

  start(seconds: number, onExpire: () => void): number {
    this.cancel();
    this._endsAt = Date.now() + seconds * 1000;
    this.timeout = setTimeout(() => {
      this._endsAt = null;
      this.timeout = null;
      onExpire();
    }, seconds * 1000);
    return this._endsAt;
  }

  addTime(seconds: number, onExpire: () => void): number {
    this.cancel();
    this._endsAt = Date.now() + seconds * 1000;
    this.timeout = setTimeout(() => {
      this._endsAt = null;
      this.timeout = null;
      onExpire();
    }, seconds * 1000);
    return this._endsAt;
  }

  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this._endsAt = null;
  }
}
