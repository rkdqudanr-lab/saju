import Mascot from '../Mascot.jsx';

export default function MascotAction({
  mood = 'pointing',
  title,
  desc,
  action,
  compact = false,
  className = '',
}) {
  return (
    <div className={`mascot-action${compact ? ' mascot-action--compact' : ''}${className ? ` ${className}` : ''}`}>
      <Mascot mood={mood} size={compact ? 46 : 58} float={!compact} aria-hidden="true" />
      <div className="mascot-action__body">
        {title && <div className="mascot-action__title">{title}</div>}
        {desc && <div className="mascot-action__desc">{desc}</div>}
      </div>
      {action && <div className="mascot-action__control">{action}</div>}
    </div>
  );
}
