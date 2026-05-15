// ThemeToggle — compact sun/moon toggle for switching between light and dark mode.
// Uses Lucide icons with a smooth rotation animation.

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { mode, toggle } = useTheme();

  const icon =
    mode === 'light' ? <Sun className="h-4 w-4" /> :
    mode === 'dark'  ? <Moon className="h-4 w-4" /> :
                       <Monitor className="h-4 w-4" />;

  const label =
    mode === 'light' ? 'Switch to dark mode' :
    mode === 'dark'  ? 'Switch to system mode' :
                       'Switch to light mode';

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`
        flex h-9 w-9 items-center justify-center rounded-xl
        border border-border bg-surface text-muted
        transition-all duration-200
        hover:border-primary hover:text-primary hover:bg-primary-soft
        active:scale-95
        ${className}
      `}
    >
      <span className="transition-transform duration-300" style={{ display: 'flex' }}>
        {icon}
      </span>
    </button>
  );
}
