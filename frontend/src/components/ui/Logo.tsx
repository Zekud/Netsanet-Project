import logoMark from '../../assets/logo-mark.png';

interface LogoProps {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  isDashboard?: boolean;
}

export default function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  isDashboard = false,
}: LogoProps) {
  // Size mapping for the container
  const sizeMap = {
    sm: { box: 'h-7 w-7', text: 'text-base' },
    md: { box: 'h-9 w-9', text: 'text-lg' },
    lg: { box: 'h-11 w-11', text: 'text-xl' },
    xl: { box: 'h-14 w-14', text: 'text-2xl' },
    '2xl': { box: 'h-20 w-20', text: 'text-4xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-fidelity Circular Brand Mark Badge */}
      <div className={`relative ${currentSize.box} shrink-0 overflow-hidden rounded-full border border-border/10 bg-[#1A1D20] shadow-sm`}>
        <img
          src={logoMark}
          alt="Netsanet Logo"
          className="w-full h-full object-cover scale-[1.3] transform transition-transform hover:scale-[1.45] duration-200"
        />
      </div>

      {/* Brand Logotype */}
      {variant === 'full' && (
        <div className="flex flex-col items-start leading-none">
          <span className={`font-serif font-bold text-heading tracking-tight leading-none ${currentSize.text}`}>
            Netsanet
          </span>
          {isDashboard && (
            <span className="text-[9px] font-mono tracking-widest text-primary font-bold uppercase mt-1.5 leading-none">
              Dashboard
            </span>
          )}
        </div>
      )}
    </div>
  );
}
