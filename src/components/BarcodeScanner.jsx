import React, { useEffect, useRef, useState } from 'react';

// BarcodeScanner: modal that opens the rear camera and scans a barcode using
// the native BarcodeDetector API. Falls back to a manual numeric-entry form
// when the API or camera is unavailable.
//
// Props:
//   onScan(code): called with the detected/typed barcode string
//   onClose():    called to dismiss the modal
export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const lastTickRef = useRef(0);
  const scannedRef = useRef(false);

  const [fallback, setFallback] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    const hasNative = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    if (!hasNative) {
      setFallback(true);
      setErrMsg("Your browser can't auto-scan barcodes. Type the number below.");
      return undefined;
    }
    try {
      detectorRef.current = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
      });
    } catch {
      setFallback(true);
      setErrMsg("Barcode detector unavailable. Type the number below.");
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          try {
            await video.play();
          } catch {
            /* autoplay may need a user gesture; ignore */
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        setFallback(true);
        setErrMsg(
          e?.name === 'NotAllowedError'
            ? 'Camera permission denied. Type the barcode below.'
            : "Couldn't open the camera. Type the barcode below."
        );
      }
    })();

    return () => {
      cancelled = true;
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopEverything = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const s = streamRef.current;
    if (s) {
      try {
        s.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) {
      try {
        v.srcObject = null;
      } catch {
        /* ignore */
      }
    }
  };

  const tick = async (ts) => {
    if (scannedRef.current) return;
    rafRef.current = requestAnimationFrame(tick);
    if (ts - lastTickRef.current < 250) return;
    lastTickRef.current = ts;

    const video = videoRef.current;
    const det = detectorRef.current;
    if (!video || !det || video.readyState < 2) return;
    try {
      const results = await det.detect(video);
      if (scannedRef.current) return;
      if (results && results.length > 0) {
        const code = String(results[0].rawValue || '').trim();
        if (code) {
          scannedRef.current = true;
          stopEverything();
          onScan?.(code);
          onClose?.();
        }
      }
    } catch {
      /* transient frame errors are fine */
    }
  };

  const submitManual = (e) => {
    e?.preventDefault?.();
    const code = manualCode.replace(/\D+/g, '');
    if (!code) return;
    scannedRef.current = true;
    stopEverything();
    onScan?.(code);
    onClose?.();
  };

  const cancel = () => {
    stopEverything();
    onClose?.();
  };

  return (
    <div className="sheet-backdrop" onClick={cancel}>
      <div
        className="sheet barcode-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="barcode-head">
          <h2 style={{ margin: 0 }}>Scan barcode</h2>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={cancel}
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        {!fallback && (
          <div className="barcode-stage">
            <video
              ref={videoRef}
              className="barcode-video"
              muted
              playsInline
            />
            <div className="barcode-scanline" />
            <div className="barcode-hint">
              Point at a barcode — it scans automatically.
            </div>
          </div>
        )}

        {fallback && (
          <div className="barcode-fallback">
            {errMsg && <div className="hint">{errMsg}</div>}
            <form className="barcode-manual-input" onSubmit={submitManual}>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter barcode digits"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!manualCode.replace(/\D+/g, '')}
              >
                Look up
              </button>
            </form>
          </div>
        )}

        {!fallback && errMsg && <div className="hint">{errMsg}</div>}

        <div className="row-btns" style={{ marginTop: 12 }}>
          <button type="button" className="btn-ghost" onClick={cancel}>
            Cancel
          </button>
          {!fallback && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                stopEverything();
                setFallback(true);
                setErrMsg('Enter the barcode manually.');
              }}
            >
              Enter manually
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
