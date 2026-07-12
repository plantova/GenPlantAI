import React from 'react';
import useUIStore from '../../stores/useUIStore.js';

const TYPE_STYLES = {
  info:    { border: '#4a9eff', icon: 'ℹ' },
  success: { border: '#2ecc71', icon: '✓' },
  warning: { border: '#ff9f43', icon: '⚠' },
  error:   { border: '#e74c3c', icon: '✕' },
};

export default function NotificationToast() {
  const notifications = useUIStore((s) => s.notifications);
  const removeNotification = useUIStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map((n) => {
        const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
        return (
          <div
            key={n.id}
            className="toast"
            style={{ borderLeftColor: style.border }}
          >
            <span className="toast-icon" style={{ color: style.border }}>{style.icon}</span>
            <span className="toast-message">{n.message}</span>
            <button
              className="toast-close"
              onClick={() => removeNotification(n.id)}
              title="Dismiss"
            >×</button>
          </div>
        );
      })}
    </div>
  );
}
