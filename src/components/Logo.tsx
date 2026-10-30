import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  className = '',
  animated = true,
}) => {
  // Dimension mapping for various placements (Navbar, Landing, Sidebar, Footer)
  const dimensions = {
    sm: { box: 'w-9 h-9', text: 'text-base', badge: 'text-[10px]', subText: 'text-[9px]' },
    md: { box: 'w-11 h-11', text: 'text-lg sm:text-xl', badge: 'text-xs', subText: 'text-[10px]' },
    lg: { box: 'w-16 h-16', text: 'text-2xl sm:text-3xl', badge: 'text-sm', subText: 'text-xs' },
    xl: { box: 'w-28 h-28 sm:w-36 sm:h-36', text: 'text-4xl sm:text-6xl', badge: 'text-lg', subText: 'text-sm' },
  }[size];

  return (
    <div className={`group flex items-center gap-3 select-none ${className}`}>
      {/* Emblem Mark Container */}
      <div className={`relative flex items-center justify-center shrink-0 ${dimensions.box} transition-all duration-300 ease-out group-hover:scale-105 group-hover:-rotate-1`}>
        
        {/* Outer Pulsing Neon Aura Glow */}
        <div className={`absolute -inset-2 bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 group-hover:blur-xl transition-all duration-500 ${animated ? 'animate-pulse' : ''}`} />
        
        {/* Secondary Particle Ring Aura */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-600 rounded-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-300 blur-sm" />

        {/* Glassmorphic Cyber Emblem Frame */}
        <div className="relative w-full h-full bg-[#060911]/90 rounded-xl border border-cyan-400/50 p-1 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.25)] overflow-hidden group-hover:border-cyan-300 group-hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] transition-all duration-300 backdrop-blur-md">
          
          {/* Futuristic Mesh Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1.2px,transparent_1.2px)] [background-size:6px_6px] opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none" />

          {/* SVG Custom Stylus & Air-Calligraphy Emblem */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]"
          >
            <defs>
              <linearGradient id="calligraphyRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="40%" stopColor="#818CF8" />
                <stop offset="80%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#00FFFF" />
              </linearGradient>

              <linearGradient id="stylusBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>

              <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Rotating Outer Tech HUD Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#38BDF8"
              strokeWidth="1"
              strokeDasharray="4 6 12 6"
              opacity="0.4"
              className="animate-spin-slow origin-center"
            />

            {/* Counter-rotating Inner Compass Ring */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#818CF8"
              strokeWidth="0.8"
              strokeDasharray="2 8"
              opacity="0.35"
              className="animate-spin-reverse-slow origin-center"
            />

            {/* Clean Upright Glowing Letter "S" */}
            <path
              d="M 68 28 C 68 18, 32 18, 32 36 C 32 50, 68 50, 68 64 C 68 82, 32 82, 32 72"
              stroke="url(#calligraphyRibbon)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#neonGlow)"
              className="animate-stroke-dash"
            />
          </svg>
        </div>
      </div>

      {/* Brand Name & Subtitle */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`${dimensions.text} font-black tracking-wider bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent group-hover:from-cyan-200 group-hover:to-blue-300 transition-all duration-300 drop-shadow-[0_2px_10px_rgba(56,189,248,0.3)]`}>
              SCRIPTORA
            </span>
            <span className={`${dimensions.badge} font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] group-hover:scale-110 group-hover:border-cyan-300 transition-all duration-300`}>
              AI
            </span>
          </div>
          {showSubtitle && (
            <p className={`${dimensions.subText} text-cyan-400/80 font-mono tracking-widest uppercase font-semibold group-hover:text-cyan-300 transition-colors`}>
              AIR WRITING SYSTEM
            </p>
          )}
        </div>
      )}
    </div>
  );
};
