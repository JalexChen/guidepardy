import { TileState } from '../types';
import Tile from './Tile';

interface BoardProps {
  categories: string[];
  tiles: TileState[][];
  currentTile: { col: number; row: number } | null;
  clickable: boolean;
  onTileClick?: (col: number, row: number) => void;
}

export default function Board({ categories, tiles, currentTile, clickable, onTileClick }: BoardProps) {
  if (categories.length === 0) return null;

  return (
    <div className="board">
      {/* Category headers */}
      {categories.map((cat, i) => (
        <div key={i} className="board-category">
          {cat}
        </div>
      ))}

      {/* Tiles: 5 rows x 5 columns */}
      {[0, 1, 2, 3, 4].map(row => (
        categories.map((_, col) => (
          <Tile
            key={`${col}-${row}`}
            tile={tiles[col]?.[row] ?? { value: 0, used: true, isDailyDouble: false }}
            col={col}
            row={row}
            isActive={currentTile?.col === col && currentTile?.row === row}
            clickable={clickable && !tiles[col]?.[row]?.used}
            onClick={onTileClick}
          />
        ))
      ))}
    </div>
  );
}
