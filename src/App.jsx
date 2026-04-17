import React, { useCallback, useEffect, useState } from 'react';
import BottomNav from './components/BottomNav.jsx';
import Today from './screens/Today.jsx';
import Food from './screens/Food.jsx';
import Weight from './screens/Weight.jsx';
import Analytics from './screens/Analytics.jsx';
import { getAllLogs } from './lib/storage.js';

export default function App() {
  const [tab, setTab] = useState('today');
  const [logs, setLogs] = useState(() => getAllLogs());
  const [prefillFood, setPrefillFood] = useState(null);

  const refresh = useCallback(() => {
    setLogs(getAllLogs());
  }, []);

  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const go = useCallback((next, payload) => {
    if (payload) setPrefillFood(payload);
    setTab(next);
  }, []);

  let screen;
  if (tab === 'today') {
    screen = <Today logs={logs} onChange={refresh} onGo={go} />;
  } else if (tab === 'food') {
    screen = (
      <Food
        logs={logs}
        onChange={refresh}
        prefill={prefillFood}
        clearPrefill={() => setPrefillFood(null)}
      />
    );
  } else if (tab === 'weight') {
    screen = <Weight logs={logs} onChange={refresh} />;
  } else {
    screen = <Analytics logs={logs} />;
  }

  return (
    <div className="app-shell">
      {screen}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
