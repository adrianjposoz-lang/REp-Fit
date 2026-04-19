import React, { Suspense } from 'react';

// LazyChart: wraps lazy-loaded chart components in a Suspense boundary with a
// skeleton placeholder so the Recharts bundle only downloads on demand.
export default function LazyChart({ children, fallback }) {
  return (
    <Suspense fallback={fallback || <div className="chart-skeleton" />}>
      {children}
    </Suspense>
  );
}
