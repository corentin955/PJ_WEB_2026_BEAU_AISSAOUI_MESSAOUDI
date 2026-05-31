import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

const DARK = {
  success: { bg: '#1a2e20', border: '#A8E063', iconColor: '#A8E063', Icon: CheckCircle },
  error:   { bg: '#2d1515', border: '#ef4444', iconColor: '#ef4444', Icon: XCircle     },
  info:    { bg: '#1a2e20', border: '#9ca3af', iconColor: '#9ca3af', Icon: Info         },
  warning: { bg: '#2d2510', border: '#f59e0b', iconColor: '#f59e0b', Icon: AlertTriangle },
};

const LIGHT = {
  success: { bg: '#f0fde8', border: '#2d7a0a', iconColor: '#2d7a0a', Icon: CheckCircle },
  error:   { bg: '#fde8e8', border: '#ef4444', iconColor: '#ef4444', Icon: XCircle     },
  info:    { bg: '#f5f5f5', border: '#888',    iconColor: '#888',    Icon: Info         },
  warning: { bg: '#fef9e7', border: '#f59e0b', iconColor: '#f59e0b', Icon: AlertTriangle },
};

export default function Toast({ toast, bottom = 24 }) {
  if (!toast) return null;
  const isLight = document.documentElement.classList.contains('light');
  const palette  = isLight ? LIGHT : DARK;
  const cfg      = palette[toast.type] || palette.info;
  const { Icon, bg, border, iconColor } = cfg;
  const textColor = isLight ? '#1a1a1a' : '#FAFAF7';

  return (
    <div style={{
      position:   'fixed',
      bottom,
      right:      24,
      zIndex:     9999,
      background: bg,
      borderLeft: `4px solid ${border}`,
      borderRadius: 10,
      padding:    '14px 18px',
      boxShadow:  '0 4px 20px rgba(0,0,0,0.3)',
      fontFamily: 'var(--font-body)',
      fontSize:   14,
      color:      textColor,
      display:    'flex',
      alignItems: 'center',
      gap:        10,
      animation:  'toastSlideIn 0.2s ease',
      maxWidth:   360,
    }}>
      <Icon size={16} color={iconColor} style={{ flexShrink: 0 }} />
      {toast.msg}
    </div>
  );
}
