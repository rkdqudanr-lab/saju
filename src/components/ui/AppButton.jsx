import Icon from '../Icon.jsx';

export default function AppButton({
  children,
  icon,
  variant = 'primary',
  size = 'md',
  full = false,
  className = '',
  ...props
}) {
  const classes = [
    'app-button',
    `app-button--${variant}`,
    `app-button--${size}`,
    full ? 'app-button--full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} {...props}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} color="currentColor" />}
      <span className="app-button__label">{children}</span>
    </button>
  );
}
