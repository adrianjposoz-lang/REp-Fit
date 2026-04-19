import React, { useEffect, useRef, useState } from 'react';

/**
 * CopyMenu — a small "⋯" trigger that opens a floating dropdown.
 *
 * Props:
 *   onCopyYesterday?           — () => void. When provided, renders "Copy yesterday's meals"
 *   onCopyMealFromYesterday?   — () => void. When provided, renders "Copy yesterday's {mealLabel}"
 *   mealLabel?                 — display name for the meal-scoped option
 */
export default function CopyMenu({
  onCopyYesterday,
  onCopyMealFromYesterday,
  mealLabel,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const pick = (fn) => () => {
    setOpen(false);
    if (typeof fn === 'function') fn();
  };

  const hasAny =
    typeof onCopyYesterday === 'function' ||
    typeof onCopyMealFromYesterday === 'function';

  if (!hasAny) return null;

  return (
    <div className="copy-menu-root" ref={rootRef}>
      <button
        type="button"
        className="copy-menu-trigger"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div className="copy-menu" role="menu">
          {typeof onCopyYesterday === 'function' && (
            <button
              type="button"
              role="menuitem"
              className="copy-menu-item"
              onClick={pick(onCopyYesterday)}
            >
              Copy yesterday&rsquo;s meals
            </button>
          )}
          {typeof onCopyMealFromYesterday === 'function' && (
            <button
              type="button"
              role="menuitem"
              className="copy-menu-item"
              onClick={pick(onCopyMealFromYesterday)}
            >
              Copy yesterday&rsquo;s {mealLabel || 'meal'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
