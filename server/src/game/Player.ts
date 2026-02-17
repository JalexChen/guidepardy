import { PlayerState } from '../types';

export class Player {
  id: string;
  name: string;
  score: number;
  connected: boolean;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.score = 0;
    this.connected = true;
  }

  toState(): PlayerState {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      connected: this.connected,
    };
  }
}
