import * as fs from 'fs';
import * as path from 'path';
import { BoardData, TileData, TileState } from '../types';

export class Board {
  private data: BoardData;
  private tileStates: TileState[][];
  private tileData: TileData[][];
  private dailyDoubles: Set<string> = new Set();

  constructor(boardPath: string) {
    const raw = fs.readFileSync(boardPath, 'utf-8');
    this.data = JSON.parse(raw);

    this.tileData = this.data.categories.map(cat => cat.tiles);
    this.tileStates = this.data.categories.map(cat =>
      cat.tiles.map(tile => ({
        value: tile.value,
        used: false,
        isDailyDouble: false,
      }))
    );

    this.assignDailyDoubles();
  }

  private assignDailyDoubles(): void {
    const positions: { col: number; row: number }[] = [];
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        positions.push({ col, row });
      }
    }

    // Shuffle and pick 2
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (let i = 0; i < 2; i++) {
      const { col, row } = positions[i];
      this.tileStates[col][row].isDailyDouble = true;
      this.dailyDoubles.add(`${col}-${row}`);
    }
  }

  get name(): string {
    return this.data.name;
  }

  get categories(): string[] {
    return this.data.categories.map(c => c.name);
  }

  getTileStates(): TileState[][] {
    return this.tileStates;
  }

  getTileData(col: number, row: number): TileData {
    return this.tileData[col][row];
  }

  getTileState(col: number, row: number): TileState {
    return this.tileStates[col][row];
  }

  markUsed(col: number, row: number): void {
    this.tileStates[col][row].used = true;
  }

  isDailyDouble(col: number, row: number): boolean {
    return this.dailyDoubles.has(`${col}-${row}`);
  }

  allTilesUsed(): boolean {
    return this.tileStates.every(col => col.every(tile => tile.used));
  }

  static listBoards(boardsDir: string): string[] {
    return fs.readdirSync(boardsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }
}
