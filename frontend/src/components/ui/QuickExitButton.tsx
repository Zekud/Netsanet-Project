// QuickExitButton — safety feature visible on EVERY survivor-facing page.
// On click: clears sessionStorage and redirects to google.com immediately.
// Now includes Escape key shortcut and Lucide icon.

import { useEffect } from 'react';
import { LogOut } from 'lucide-react';

export default function QuickExitButton() {
  const handleExit = () => {
    sessionStorage.clear();
    window.location.replace('https://google.com');
  };

  // Keyboard shortcut: Escape key to exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && e.shiftKey) handleExit();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <button
      onClick={handleExit}
      className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-exit-red hover:brightness-110 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all duration-150 shadow-lg hover:shadow-xl active:scale-95"
      aria-label="Quick exit — leave this site immediately (Shift+Escape)"
      title="Shift+Escape to exit"
    >
      <LogOut className="h-3.5 w-3.5" />
      Quick Exit
    </button>
  );
}
