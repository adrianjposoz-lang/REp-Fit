import React, { useEffect, useRef, useState } from 'react';

// VoiceSearch: tap-to-speak mic button backed by the Web Speech API.
// Props:
//   onTranscript(text): called once with the final transcript
//   onError(message): optional — called when speech recognition is unsupported or errors out
export default function VoiceSearch({ onTranscript, onError }) {
  const [recording, setRecording] = useState(false);
  const recogRef = useRef(null);

  useEffect(() => {
    return () => {
      // Ensure we stop any active recognition when unmounted.
      try {
        recogRef.current?.abort?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = () => {
    const R =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!R) {
      onError?.('Voice input not supported on this browser');
      return;
    }
    try {
      const rec = new R();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      rec.onresult = (e) => {
        const res = e.results?.[0];
        const transcript = res?.[0]?.transcript?.trim();
        if (transcript) onTranscript?.(transcript);
      };
      rec.onerror = (e) => {
        if (e?.error && e.error !== 'aborted' && e.error !== 'no-speech') {
          onError?.(`Voice error: ${e.error}`);
        }
      };
      rec.onend = () => {
        setRecording(false);
        recogRef.current = null;
      };

      recogRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (err) {
      setRecording(false);
      recogRef.current = null;
      onError?.('Could not start voice input');
    }
  };

  const stop = () => {
    try {
      recogRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    setRecording(false);
  };

  const toggle = () => {
    if (recording) stop();
    else start();
  };

  return (
    <button
      type="button"
      className={`voice-btn${recording ? ' recording' : ''}`}
      onClick={toggle}
      aria-label={recording ? 'Stop voice input' : 'Start voice input'}
      title={recording ? 'Stop' : 'Voice search'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    </button>
  );
}
