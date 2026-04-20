import React, { useCallback, useEffect, useState } from 'react';
import BottomNav from './components/BottomNav.jsx';
import ProfileHeader from './components/ProfileHeader.jsx';
import AIMealModal from './components/AIMealModal.jsx';
import Today from './screens/Today.jsx';
import Food from './screens/Food.jsx';
import Workouts from './screens/Workouts.jsx';
import Weight from './screens/Weight.jsx';
import Analytics from './screens/Analytics.jsx';
import Login from './screens/Login.jsx';
import Setup from './screens/Setup.jsx';
import Settings from './screens/Settings.jsx';
import {
  hasConfig,
  isUnlocked,
  getProfile,
  saveProfile,
  getConfig,
  setUnlockedFor,
  lock,
  setCurrentProfile,
} from './lib/storage.js';
import { todayKey } from './lib/dates.js';
import { hasAIKey } from './lib/ai.js';
import { mealLabelFor } from './lib/constants.js';
import {
  loadHealthConfig,
  saveHealthConfig,
  fetchHealthGist,
  mergeHealthIntoProfile,
} from './lib/healthSync.js';

const UNLOCK_MS = 30 * 24 * 3600 * 1000;

function defaultMealForNow() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 20) return 'dinner';
  return 'snacks';
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [tab, setTab] = useState('today');
  const [date, setDate] = useState(() => todayKey());
  const [profile, setProfile] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [prefillFood, setPrefillFood] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const aiEnabled = hasAIKey();

  const refresh = useCallback(() => {
    setProfile(getProfile());
  }, []);

  const runAutoSync = useCallback(async () => {
    const cfg = loadHealthConfig();
    if (!cfg?.autoSync || !cfg?.gistId) return;
    try {
      const payload = await fetchHealthGist(cfg.gistId, cfg.token);
      const p = getProfile();
      if (!p) return;
      const { touched } = mergeHealthIntoProfile(p, payload);
      if (touched > 0) {
        const pid = getConfig()?.currentProfile;
        if (pid) saveProfile(pid, p);
      }
      saveHealthConfig({ ...cfg, lastSyncedAt: Date.now() });
      setProfile(getProfile());
    } catch {
      // silent — user can retry in Settings
    }
  }, []);

  useEffect(() => {
    if (!hasConfig()) {
      setNeedsSetup(true);
      setBooted(true);
      return;
    }
    const alreadyUnlocked = isUnlocked();
    if (alreadyUnlocked) setUnlocked(true);
    setProfile(getProfile());
    setBooted(true);
    if (alreadyUnlocked) {
      setTimeout(() => runAutoSync(), 0);
    }
  }, [runAutoSync]);

  const handleSetupComplete = useCallback(() => {
    setNeedsSetup(false);
    setUnlocked(true);
    setUnlockedFor(UNLOCK_MS);
    setProfile(getProfile());
    runAutoSync();
  }, [runAutoSync]);

  const handleUnlock = useCallback(() => {
    setUnlocked(true);
    setUnlockedFor(UNLOCK_MS);
    setProfile(getProfile());
    runAutoSync();
  }, [runAutoSync]);

  const handleLock = useCallback(() => {
    lock();
    setUnlocked(false);
  }, []);

  const handleProfileSwitch = useCallback((id) => {
    setCurrentProfile(id);
    setProfile(getProfile());
    setShowSettings(false);
  }, []);

  const onGo = useCallback((next, payload) => {
    if (payload) setPrefillFood(payload);
    setTab(next);
  }, []);

  if (!booted) return null;
  if (needsSetup) return <Setup onComplete={handleSetupComplete} />;
  if (!unlocked) return <Login onUnlock={handleUnlock} />;
  if (showSettings) {
    return (
      <Settings
        profile={profile}
        onChange={refresh}
        onClose={() => setShowSettings(false)}
        onLock={handleLock}
        onProfileSwitch={handleProfileSwitch}
      />
    );
  }

  const screenProps = {
    profile,
    date,
    onChange: refresh,
    onDateChange: setDate,
    onGo,
  };

  let screen;
  if (tab === 'today') {
    screen = <Today {...screenProps} />;
  } else if (tab === 'food') {
    screen = (
      <Food
        {...screenProps}
        prefill={prefillFood}
        clearPrefill={() => setPrefillFood(null)}
      />
    );
  } else if (tab === 'workouts') {
    screen = <Workouts {...screenProps} />;
  } else if (tab === 'weight') {
    screen = <Weight {...screenProps} />;
  } else {
    screen = <Analytics {...screenProps} />;
  }

  const loggedDate = todayKey();

  return (
    <div className="app-shell">
      <ProfileHeader
        profile={profile}
        onOpenSettings={() => setShowSettings(true)}
        onLock={handleLock}
        onProfileSwitch={handleProfileSwitch}
      />
      {screen}
      {aiEnabled && (
        <button
          className="ai-fab"
          type="button"
          aria-label="AI meal entry"
          onClick={() => setAiOpen(true)}
        >
          <span className="ai-fab-icon">✨</span>
        </button>
      )}
      <BottomNav active={tab} onChange={setTab} />
      {aiOpen && aiEnabled && (
        <AIMealModal
          profile={profile}
          date={loggedDate}
          defaultMeal={defaultMealForNow()}
          onClose={() => setAiOpen(false)}
          onLogged={(meal, n) => {
            setAiOpen(false);
            refresh();
            const label = mealLabelFor(profile, meal);
            setToast(`Logged ${n} item${n === 1 ? '' : 's'} to ${label}`);
            setTimeout(() => setToast(null), 2200);
          }}
        />
      )}
      {toast && <div className="app-toast">{toast}</div>}
    </div>
  );
}
