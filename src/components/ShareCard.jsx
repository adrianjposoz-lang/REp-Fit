import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { totalsForDay, sevenDayWeight } from '../lib/targets.js';
import { todayKey, parseKey, formatShortDate } from '../lib/dates.js';

function latestWeight(profile) {
  const logs = profile?.logs || {};
  const dated = Object.entries(logs)
    .filter(([, v]) => typeof v?.weight === 'number' && !Number.isNaN(v.weight))
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));
  if (dated.length) return dated[0][1].weight;
  const start = Number(profile?.settings?.startWeight);
  return Number.isFinite(start) && start > 0 ? start : null;
}

function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSvg({ name, dateLabel, calories, protein, weight }) {
  const W = 540;
  const H = 720;
  const safeName = escapeXml(name || 'Athlete');
  const safeDate = escapeXml(dateLabel);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#16181d"/>
      <stop offset="55%" stop-color="#0c0d10"/>
      <stop offset="100%" stop-color="#06070a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="24" ry="24"
        fill="none" stroke="#262a31" stroke-width="1"/>

  <!-- Brand stripe -->
  <rect x="40" y="56" width="72" height="4" rx="2" fill="url(#accent)"/>
  <text x="40" y="98" font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="14" fill="#8a8f98" letter-spacing="3"
        font-weight="600">REP-FIT · DAILY CARD</text>

  <!-- Athlete + date -->
  <text x="40" y="158" font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="36" font-weight="800" fill="#ffffff">${safeName}</text>
  <text x="40" y="188" font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="15" fill="#8a8f98" letter-spacing="2">${safeDate}</text>

  <!-- Divider -->
  <line x1="40" y1="220" x2="${W - 40}" y2="220" stroke="#1f222a" stroke-width="1"/>

  <!-- Calories tile -->
  <text x="40" y="268" font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="12" fill="#8a8f98" letter-spacing="3"
        font-weight="700">CALORIES</text>
  <text x="40" y="332" font-family="Barlow Condensed, DM Sans, Helvetica, Arial, sans-serif"
        font-size="78" font-weight="800" fill="#f59e0b">${escapeXml(calories)}</text>
  <text x="${40 + String(calories).length * 26 + 14}" y="332"
        font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="18" fill="#8a8f98" letter-spacing="2">kcal</text>

  <!-- Protein tile -->
  <text x="40" y="400" font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="12" fill="#8a8f98" letter-spacing="3"
        font-weight="700">PROTEIN</text>
  <text x="40" y="464" font-family="Barlow Condensed, DM Sans, Helvetica, Arial, sans-serif"
        font-size="78" font-weight="800" fill="#22c55e">${escapeXml(protein)}</text>
  <text x="${40 + String(protein).length * 26 + 14}" y="464"
        font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="18" fill="#8a8f98" letter-spacing="2">g</text>

  <!-- Weight tile -->
  <text x="40" y="532" font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="12" fill="#8a8f98" letter-spacing="3"
        font-weight="700">WEIGHT</text>
  <text x="40" y="596" font-family="Barlow Condensed, DM Sans, Helvetica, Arial, sans-serif"
        font-size="78" font-weight="800" fill="#3b82f6">${escapeXml(weight)}</text>
  <text x="${40 + String(weight).length * 26 + 14}" y="596"
        font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="18" fill="#8a8f98" letter-spacing="2">lb</text>

  <!-- Footer watermark -->
  <line x1="40" y1="640" x2="${W - 40}" y2="640" stroke="#1f222a" stroke-width="1"/>
  <text x="40" y="678" font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="13" fill="#5a5f6a" letter-spacing="4" font-weight="700">REP-FIT</text>
  <text x="${W - 40}" y="678" text-anchor="end"
        font-family="DM Sans, Helvetica, Arial, sans-serif"
        font-size="12" fill="#5a5f6a" letter-spacing="2">built &amp; tracked</text>
</svg>`;
}

const ShareCard = forwardRef(function ShareCard({ profile, date }, ref) {
  const hiddenRef = useRef(null);
  const dateKey = date || todayKey();
  const day = profile?.logs?.[dateKey] || {};
  const totals = totalsForDay(day);
  const name = profile?.name || profile?.settings?.name || 'Athlete';

  const calories = Math.round(totals.calories || 0);
  const protein = Math.round(totals.protein || 0);
  let weight = day?.weight;
  if (typeof weight !== 'number') {
    const avg7 = sevenDayWeight(profile);
    weight = avg7 ?? latestWeight(profile);
  }
  const weightLabel =
    typeof weight === 'number' && Number.isFinite(weight) ? weight.toFixed(1) : '—';

  let dateLabel;
  try {
    dateLabel = formatShortDate(parseKey(dateKey)).toUpperCase();
  } catch {
    dateLabel = dateKey;
  }

  const download = () => {
    const svg = buildSvg({
      name,
      dateLabel,
      calories: String(calories),
      protein: String(protein),
      weight: weightLabel,
    });

    try {
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 540;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `repfit-${dateKey}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (err) {
          // fallback: download the SVG itself
          const a = document.createElement('a');
          a.href = URL.createObjectURL(svgBlob);
          a.download = `repfit-${dateKey}.svg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      // no-op
    }
  };

  useImperativeHandle(ref, () => ({ download }), [
    dateKey,
    calories,
    protein,
    weightLabel,
    name,
  ]);

  return (
    <div
      ref={hiddenRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        top: '-10000px',
        width: 540,
        height: 720,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 540,
          height: 720,
          background:
            'linear-gradient(180deg, #16181d 0%, #0c0d10 55%, #06070a 100%)',
          border: '1px solid #262a31',
          borderRadius: 24,
          padding: 40,
          color: '#fff',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <div style={{ letterSpacing: 3, color: '#8a8f98', fontSize: 13 }}>
          REP-FIT · DAILY CARD
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, marginTop: 30 }}>{name}</div>
        <div style={{ color: '#8a8f98', letterSpacing: 2, marginTop: 6 }}>
          {dateLabel}
        </div>
        <div style={{ marginTop: 40 }}>
          <div style={{ color: '#8a8f98', letterSpacing: 3, fontSize: 12 }}>
            CALORIES
          </div>
          <div style={{ color: '#f59e0b', fontSize: 64, fontWeight: 800 }}>
            {calories} <span style={{ fontSize: 16, color: '#8a8f98' }}>kcal</span>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ color: '#8a8f98', letterSpacing: 3, fontSize: 12 }}>
            PROTEIN
          </div>
          <div style={{ color: '#22c55e', fontSize: 64, fontWeight: 800 }}>
            {protein} <span style={{ fontSize: 16, color: '#8a8f98' }}>g</span>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ color: '#8a8f98', letterSpacing: 3, fontSize: 12 }}>
            WEIGHT
          </div>
          <div style={{ color: '#3b82f6', fontSize: 64, fontWeight: 800 }}>
            {weightLabel} <span style={{ fontSize: 16, color: '#8a8f98' }}>lb</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
