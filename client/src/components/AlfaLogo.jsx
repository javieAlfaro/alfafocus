import React from 'react';

/**
 * AlfaIcon — Scalable vector logo mark for AlfaFocus.
 * Features a minimalist continuous-line Greek Alpha (α) with a centered precision focal dot.
 * Styled with bold modern tech geometry (Linear/Vercel aesthetic).
 */
export function AlfaIcon({ 
  size = 20, 
  className = "text-emerald-400",
  strokeWidth = 3.4,
  ...props 
}) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      width={size} 
      height={size} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Precision Focal Center Dot */}
      <circle 
        cx="13" 
        cy="16" 
        r="3.2" 
        fill="currentColor" 
      />
      {/* Continuous Geometric Greek Alpha (α) Stroke */}
      <path 
        d="M 24.5 7.5 C 22 12 19.5 16 16.5 16 C 12.8 16 9.8 13.1 9.8 9.5 C 9.8 5.9 12.8 3 16.5 3 C 20.2 3 23.2 5.9 23.2 9.5 C 23.2 13.1 20.2 16 16.5 16 C 12.8 16 9.8 18.9 9.8 22.5 C 9.8 26.1 12.8 29 16.5 29 C 19.5 29 22 26 24.5 24.5" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

/**
 * AlfaLogo — Primary branding lockup component.
 * Combines the Dark Slate Squircle tile with the continuous Alpha mark
 * and the Dual-Weight Dual-Tone wordmark ("AlfaFocus").
 *
 * Props:
 * - variant: 'full' (icon + wordmark), 'icon' (just squircle tile), 'markOnly' (raw SVG mark), 'badge' (with command center pill)
 * - size: 'sm' (h-7), 'md' (h-9), 'lg' (h-11)
 * - onClick: optional click handler
 * - showWordmark: boolean (toggle wordmark visibility)
 * - subtitle: optional subtitle string
 * - className: additional wrapper classes
 */
export default function AlfaLogo({
  variant = 'full',
  size = 'md',
  onClick,
  showWordmark = true,
  subtitle,
  className = '',
}) {
  // Tile dimension presets
  const sizeStyles = {
    sm: {
      tile: 'w-7 h-7 rounded-lg',
      iconSize: 15,
      text: 'text-base',
      strokeWidth: 3.6,
    },
    md: {
      tile: 'w-9 h-9 rounded-xl',
      iconSize: 20,
      strokeWidth: 3.4,
      text: 'text-lg',
    },
    lg: {
      tile: 'w-11 h-11 rounded-2xl',
      iconSize: 24,
      strokeWidth: 3.2,
      text: 'text-xl',
    },
  }[size] || {
    tile: 'w-9 h-9 rounded-xl',
    iconSize: 20,
    strokeWidth: 3.4,
    text: 'text-lg',
  };

  const isInteractive = Boolean(onClick);

  return (
    <div 
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
      className={`inline-flex items-center gap-3 select-none ${
        isInteractive ? 'cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl' : ''
      } ${className}`}
      title="AlfaFocus — Productivity & Focus Command Center"
    >
      {/* Icon Frame: Dark Slate Squircle Tile */}
      {variant !== 'markOnly' ? (
        <div 
          className={`${sizeStyles.tile} bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-sm shrink-0 transition-all duration-200 ${
            isInteractive ? 'group-hover:border-emerald-500/50 group-hover:bg-zinc-850 group-hover:scale-[1.03]' : ''
          }`}
        >
          <AlfaIcon 
            size={sizeStyles.iconSize} 
            strokeWidth={sizeStyles.strokeWidth}
            className="text-emerald-400 transition-colors group-hover:text-emerald-300" 
          />
        </div>
      ) : (
        <AlfaIcon 
          size={sizeStyles.iconSize} 
          strokeWidth={sizeStyles.strokeWidth}
          className="text-emerald-400 shrink-0" 
        />
      )}

      {/* Wordmark: Dual-Weight Dual-Tone */}
      {(variant === 'full' || variant === 'badge') && showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`${sizeStyles.text} tracking-tight font-sans`}>
              <span className="font-extrabold text-white">Alfa</span>
              <span className="font-bold text-emerald-400">Focus</span>
            </span>
            {variant === 'badge' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                PRO
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono font-medium mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
