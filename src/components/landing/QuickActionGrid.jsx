import ActionTile from './ActionTile.jsx';

export default function QuickActionGrid({ tiles = [], columns = 2 }) {
  if (!tiles.length) return null;
  return (
    <div
      className="tile-grid"
      style={columns !== 2 ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
    >
      {tiles.map((tile, i) => (
        <ActionTile key={i} {...tile} />
      ))}
    </div>
  );
}
