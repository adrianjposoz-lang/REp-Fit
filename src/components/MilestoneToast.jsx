import React, { useEffect } from 'react';

export default function MilestoneToast({ value, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="milestone-toast" role="status">
      <span className="milestone-emoji">🎉</span>
      <div>
        <div className="milestone-title">Milestone hit!</div>
        <div className="milestone-sub">You just crossed {value} lb</div>
      </div>
      <button className="milestone-dismiss" onClick={onDismiss}>×</button>
    </div>
  );
}
