import { TileState } from '../types';

interface TileProps {
  tile: TileState;
  col: number;
  row: number;
  isActive: boolean;
  clickable: boolean;
  onClick?: (col: number, row: number) => void;
}

export default function Tile({ tile, col, row, isActive, clickable, onClick }: TileProps) {
  if (tile.used) {
    return <div className="tile tile-used" />;
  }

  return (
    <div
      className={`tile ${isActive ? 'tile-active' : ''} ${clickable ? 'tile-clickable' : ''}`}
      onClick={() => clickable && onClick?.(col, row)}
    >
      <span className="tile-value">${tile.value}</span>
    </div>
  );
}
