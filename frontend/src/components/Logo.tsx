import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true,
  className = ''
}) => {
  const dimensions = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
  };

  const textSize = {
    small: { title: 16, subtitle: 10 },
    medium: { title: 20, subtitle: 12 },
    large: { title: 28, subtitle: 14 },
  };

  const dim = dimensions[size];
  const text = textSize[size];

  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: size === 'small' ? 8 : 12 
      }}
    >
      {/* Logo图标 - 渐变色播放按钮 */}
      <svg 
        width={dim.width} 
        height={dim.height} 
        viewBox="0 0 48 48" 
        fill="none"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect 
          width="48" 
          height="48" 
          rx="12" 
          fill="url(#logoGradient)"
        />
        <path 
          d="M19 16L32 24L19 32V16Z" 
          fill="white"
          fillOpacity="0.9"
        />
        <circle cx="36" cy="12" r="4" fill="url(#logoGradient2)" />
      </svg>
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column'}}>
          <span 
            style={{ 
              fontSize: text.title, 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
          >
            CreatorHub
          </span>
          {size !== 'small' && (
            <span 
              style={{ 
                fontSize: text.subtitle, 
                color: '#bdc3c7',
                lineHeight: 1.2,
              }}
            >
              跨境短视频协同管理
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
