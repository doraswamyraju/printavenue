'use client';

import React, { useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  enabled?: boolean;
}

export const ProtectedPreviewShield: React.FC<Props> = ({
  children,
  enabled = true,
}) => {
  useEffect(() => {
    if (!enabled) return;

    const preventContext = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const preventKey = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+P, Ctrl+U
      if (
        (e.ctrlKey || e.metaKey) &&
        ['s', 'p', 'u'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', preventContext);
    window.addEventListener('keydown', preventKey);

    return () => {
      window.removeEventListener('contextmenu', preventContext);
      window.removeEventListener('keydown', preventKey);
    };
  }, [enabled]);

  return (
    <div
      onContextMenu={(e) => enabled && e.preventDefault()}
      className={`relative select-none ${
        enabled ? 'pointer-events-auto [user-select:none]' : ''
      }`}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {children}
      {/* Invisible overlay shield layer that intercepts dragging & saving */}
      {enabled && (
        <div
          className="absolute inset-0 z-30 bg-transparent pointer-events-none"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

