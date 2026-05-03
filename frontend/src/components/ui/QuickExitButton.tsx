// QuickExitButton — safety feature visible on EVERY survivor-facing page.
// On click: clears sessionStorage and redirects to google.com immediately.

export default function QuickExitButton() {
  const handleExit = () => {
    sessionStorage.clear();
    window.location.replace('https://google.com');
  };

  return (
    <button
      onClick={handleExit}
      className="fixed top-4 right-4 z-50 bg-exit-red hover:bg-red-600 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors duration-150 shadow-md"
      aria-label="Quick exit — leave this site immediately"
    >
      Quick Exit
    </button>
  );
}
