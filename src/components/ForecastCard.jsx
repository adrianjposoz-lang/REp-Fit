import React from 'react';
import { forecastGoalDate } from '../lib/coach.js';
import { getProfile } from '../lib/storage.js';

function daysBetween(a, b) {
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / (24 * 3600 * 1000));
}

export default function ForecastCard({ profile }) {
  const p = profile || getProfile();
  const goal = Number(p?.settings?.goalWeight) || 0;
  const forecast = forecastGoalDate(p);

  if (!forecast || forecast.trend === 'wrong-direction') {
    const rate = forecast ? Math.abs(forecast.lbsPerWeek) : 0;
    return (
      <div className="card forecast-card forecast-warning">
        <div className="card-title">Forecast</div>
        <div className="forecast-sub">
          Current trend is away from your goal of {goal} lb. Average loss is {rate.toFixed(2)} lb/week.
        </div>
      </div>
    );
  }

  if (forecast.trend === 'flat') {
    return (
      <div className="card forecast-card forecast-warning">
        <div className="card-title">Forecast</div>
        <div className="forecast-sub">
          Weight trend is flat — consider adjusting intake.
        </div>
      </div>
    );
  }

  if (forecast.trend === 'already-hit') {
    return (
      <div className="card forecast-card">
        <div className="card-title">Forecast</div>
        <div className="forecast-eta">🎉 You've reached your goal!</div>
      </div>
    );
  }

  const rate = Math.abs(forecast.lbsPerWeek).toFixed(2);
  const daysLeft = daysBetween(forecast.eta, new Date());
  return (
    <div className="card forecast-card">
      <div className="card-title">Forecast</div>
      <div className="forecast-eta">{forecast.eta.toLocaleDateString()}</div>
      <div className="forecast-sub">
        at your current rate of {rate} lb/week ({forecast.weighIns} weigh-ins over 42 days)
      </div>
      <div className="forecast-sub">
        {daysLeft} {daysLeft === 1 ? 'day' : 'days'} from today
      </div>
    </div>
  );
}
