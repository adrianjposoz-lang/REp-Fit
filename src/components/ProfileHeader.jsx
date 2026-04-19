import React, { useEffect, useRef, useState } from 'react';
import { getConfig, getProfile } from '../lib/storage.js';

export default function ProfileHeader({ profile, onOpenSettings, onLock, onProfileSwitch }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  const cfg = getConfig();
  const currentId = cfg?.currentProfile;
  const otherIds = (cfg?.profiles || []).filter((id) => id !== currentId);

  const name = profile?.settings?.name || profile?.name || 'Profile';
  const initial = name?.[0]?.toUpperCase() || '?';

  return (
    <header className="profile-header" ref={ref}>
      <button
        type="button"
        className="ph-name"
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch profile"
      >
        <span className="ph-avatar">{initial}</span>
        <span className="ph-name-text">{name}</span>
        <span className="ph-chev" aria-hidden>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      <div className="ph-actions">
        <button
          type="button"
          className="ph-icon-btn"
          onClick={onLock}
          aria-label="Lock"
          title="Lock"
        >
          <span aria-hidden>🔒</span>
        </button>
        <button
          type="button"
          className="ph-icon-btn"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
        >
          <span aria-hidden>⚙️</span>
        </button>
      </div>

      {open && (
        <div className="ph-dropdown" role="menu">
          <div className="ph-dd-head">Profiles</div>
          {otherIds.length === 0 ? (
            <div className="ph-dd-empty">No other profiles</div>
          ) : (
            otherIds.map((id) => {
              const p = getProfile(id);
              const nm = p?.settings?.name || p?.name || id;
              return (
                <button
                  key={id}
                  type="button"
                  className="ph-dd-item"
                  onClick={() => {
                    setOpen(false);
                    onProfileSwitch?.(id);
                  }}
                >
                  <span className="ph-avatar sm">{(nm[0] || '?').toUpperCase()}</span>
                  <span>{nm}</span>
                </button>
              );
            })
          )}
          <div className="ph-dd-sep" />
          <button
            type="button"
            className="ph-dd-item"
            onClick={() => {
              setOpen(false);
              onOpenSettings?.();
            }}
          >
            <span className="ph-dd-gear" aria-hidden>⚙️</span>
            <span>Manage profiles</span>
          </button>
        </div>
      )}
    </header>
  );
}
