import React, { useMemo, useRef, useState } from 'react';
import {
  getDay,
  setMeasurements,
  addPhoto,
  deletePhoto,
} from '../lib/storage.js';
import { formatShortDate, parseKey } from '../lib/dates.js';
import {
  MEASUREMENT_KEYS,
  MEASUREMENT_LABELS,
} from '../lib/constants.js';

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.75;

function resizeDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image decode failed'));
      img.onload = () => {
        try {
          const { width, height } = img;
          const longest = Math.max(width, height);
          const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
          const w = Math.round(width * scale);
          const h = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Scan logs backwards from the day BEFORE `date` to find the most recent
// previous value for each measurement key.
function previousMeasurements(profile, date) {
  const out = {};
  const logs = profile?.logs || {};
  const keys = Object.keys(logs)
    .filter((k) => k < date)
    .sort()
    .reverse();
  const need = new Set(MEASUREMENT_KEYS);
  for (const k of keys) {
    if (need.size === 0) break;
    const m = logs[k]?.measurements;
    if (!m) continue;
    for (const key of Array.from(need)) {
      if (m[key] != null && m[key] !== '' && !Number.isNaN(Number(m[key]))) {
        out[key] = { value: Number(m[key]), date: k };
        need.delete(key);
      }
    }
  }
  return out;
}

export default function Body({ date, profile, onClose, onChange }) {
  const day = useMemo(() => getDay(date), [date, profile]);
  const prev = useMemo(() => previousMeasurements(profile, date), [profile, date]);

  const startDrafts = () => {
    const base = {};
    for (const k of MEASUREMENT_KEYS) {
      const v = day.measurements?.[k];
      base[k] = v == null || v === '' ? '' : String(v);
    }
    return base;
  };
  const [drafts, setDrafts] = useState(startDrafts);
  const [savedFlash, setSavedFlash] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef(null);

  const photos = day.photos || [];

  const handleSaveMeasurements = () => {
    const patch = {};
    for (const k of MEASUREMENT_KEYS) {
      const raw = drafts[k];
      if (raw === '' || raw == null) continue;
      const num = Number(raw);
      if (Number.isNaN(num)) continue;
      patch[k] = num;
    }
    setMeasurements(date, patch);
    onChange?.();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  };

  const handleFiles = async (e) => {
    setPhotoError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      try {
        const dataUrl = await resizeDataUrl(f);
        addPhoto(date, dataUrl);
      } catch (err) {
        setPhotoError(err?.message || 'Could not process photo.');
      }
    }
    if (fileRef.current) fileRef.current.value = '';
    onChange?.();
  };

  const handleDeletePhoto = (i) => {
    deletePhoto(date, i);
    setConfirmDel(null);
    setPreviewIdx(null);
    onChange?.();
  };

  return (
    <div className="fullscreen-modal">
      <div className="fullscreen-head">
        <button className="icon-btn back-btn" onClick={onClose} aria-label="Back">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="fullscreen-title">Body</div>
        <div className="fullscreen-date">{formatShortDate(parseKey(date))}</div>
      </div>

      <div className="fullscreen-body">
        <div className="card body-form">
          <div className="card-title">Measurements (in)</div>
          <div className="measurement-grid">
            {MEASUREMENT_KEYS.map((k) => {
              const p = prev[k];
              return (
                <label key={k} className="measurement-input-wrap">
                  <span className="measurement-label">{MEASUREMENT_LABELS[k]}</span>
                  <input
                    className="measurement-input"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder={p ? String(p.value) : '—'}
                    value={drafts[k]}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [k]: e.target.value }))
                    }
                  />
                  <span className="measurement-caption">
                    {p
                      ? `Last ${p.value} on ${formatShortDate(parseKey(p.date))}`
                      : 'No prior log'}
                  </span>
                </label>
              );
            })}
          </div>
          <button
            className="btn-primary"
            onClick={handleSaveMeasurements}
            style={{ marginTop: 10 }}
          >
            {savedFlash ? 'Saved' : 'Save measurements'}
          </button>
        </div>

        <div className="card body-form">
          <div className="card-title">Progress photos</div>
          <div className="hint" style={{ marginBottom: 8 }}>
            Photos live on this device only. Export via Settings → Data to back up.
          </div>
          <button
            className="btn-ghost"
            onClick={() => fileRef.current?.click()}
          >
            + Add photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            style={{ display: 'none' }}
            onChange={handleFiles}
          />
          {photoError && (
            <div className="error" style={{ marginTop: 10 }}>
              <span>{photoError}</span>
              <button className="btn-sm" onClick={() => setPhotoError('')}>
                Dismiss
              </button>
            </div>
          )}
          {photos.length === 0 ? (
            <div className="empty" style={{ marginTop: 10 }}>
              No photos yet.
            </div>
          ) : (
            <div className="photo-grid">
              {photos.map((src, i) => (
                <button
                  key={i}
                  className="photo-tile"
                  onClick={() => setPreviewIdx(i)}
                  aria-label={`Photo ${i + 1}`}
                >
                  <img src={src} alt={`Progress ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewIdx != null && photos[previewIdx] && (
        <div
          className="photo-preview"
          onClick={() => {
            setConfirmDel(null);
            setPreviewIdx(null);
          }}
        >
          <img
            src={photos[previewIdx]}
            alt={`Progress ${previewIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="photo-preview-actions"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmDel === previewIdx ? (
              <div className="confirm-inline">
                <span>Delete photo?</span>
                <div>
                  <button
                    className="btn-sm"
                    onClick={() => setConfirmDel(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="danger-btn sm"
                    onClick={() => handleDeletePhoto(previewIdx)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  className="btn-sm"
                  onClick={() => setPreviewIdx(null)}
                >
                  Close
                </button>
                <button
                  className="photo-delete danger-btn sm"
                  onClick={() => setConfirmDel(previewIdx)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
