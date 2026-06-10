import AppButton from './AppButton.jsx';
import Mascot from '../Mascot.jsx';

export default function EmptyState({
  mood = 'thinking',
  title,
  desc,
  actionLabel,
  actionIcon = 'sparkles',
  onAction,
  className = '',
}) {
  return (
    <div className={`empty-state${className ? ` ${className}` : ''}`}>
      <Mascot mood={mood} size="md" float aria-hidden="true" />
      {title && <div className="empty-state__title">{title}</div>}
      {desc && <div className="empty-state__desc">{desc}</div>}
      {actionLabel && onAction && (
        <AppButton variant="secondary" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </AppButton>
      )}
    </div>
  );
}
