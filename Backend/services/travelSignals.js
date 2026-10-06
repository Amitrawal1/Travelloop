/**
 * travelSignals — date/crowd/season/weather signals for Indian destinations.
 *
 * There is no real-time crowd API, so crowd levels are FORECAST from:
 *   - the destination's season for the trip months (peak / shoulder / off / avoid)
 *   - its baseline popularity
 *   - festivals/events in those months
 *   - date pressure: weekend share, public holidays, long weekends, school vacations
 *
 * All functions are synchronous and offline except getWeather (Open-Meteo archive).
 */

const destinations = require('../data/destinations.json');
const holidayData = require('../data/indiaHolidays.json');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TRIP_DAYS = 60;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------------------------------------------------------------------------
// Date helpers (everything in UTC to avoid TZ drift)
// ---------------------------------------------------------------------------

function parseDate(str, label = 'date') {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    throw new Error(`Invalid ${label}: expected 'YYYY-MM-DD', got ${JSON.stringify(str)}`);
  }
  const [y, m, d] = str.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d);
  const dt = new Date(ms);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error(`Invalid ${label}: ${str} is not a real calendar date`);
  }
  return ms;
}

function toISO(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function parseRange(startDate, endDate) {
  const start = parseDate(startDate, 'startDate');
  const end = parseDate(endDate, 'endDate');
  if (end < start) throw new Error(`endDate (${endDate}) must be on or after startDate (${startDate})`);
  const days = Math.round((end - start) / DAY_MS) + 1;
  if (days > MAX_TRIP_DAYS) throw new Error(`Trip too long: ${days} days (max ${MAX_TRIP_DAYS})`);
  return { start, end, days };
}

function eachDay(start, end) {
  const out = [];
  for (let t = start; t <= end; t += DAY_MS) out.push(t);
  return out;
}

const isWeekend = (ms) => {
  const wd = new Date(ms).getUTCDay();
  return wd === 0 || wd === 6;
};

function fmtShortDate(ms) {
  const d = new Date(ms);
  return `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function fmtRange(start, end) {
  return start === end ? fmtShortDate(start) : `${fmtShortDate(start)}–${fmtShortDate(end)}`;
}

/** [5,6,12] -> "May–Jun, Dec" ; handles Dec→Jan wrap. */
function fmtMonths(months) {
  if (!months || !months.length) return '';
  const set = new Set(months);
  const sorted = [...set].sort((a, b) => a - b);
  // find a start month that is not preceded by a member (so wraps like 11,12,1,2 stay together)
  let startIdx = sorted.findIndex((m) => !set.has(m === 1 ? 12 : m - 1));
  if (startIdx === -1) return 'year-round';
  const ordered = [...sorted.slice(startIdx), ...sorted.slice(0, startIdx)];
  const groups = [];
  let cur = [ordered[0]];
  for (let i = 1; i < ordered.length; i++) {
    const prev = cur[cur.length - 1];
    if (ordered[i] === (prev % 12) + 1) cur.push(ordered[i]);
    else { groups.push(cur); cur = [ordered[i]]; }
  }
  groups.push(cur);
  return groups
    .map((g) => (g.length === 1 ? MONTH_SHORT[g[0] - 1] : `${MONTH_SHORT[g[0] - 1]}–${MONTH_SHORT[g[g.length - 1] - 1]}`))
    .join(', ');
}

// ---------------------------------------------------------------------------
// Holidays & periods (data file covers 2026–2027; fixed-date ones synthesized otherwise)
// ---------------------------------------------------------------------------

const holidayMap = new Map(); // 'YYYY-MM-DD' -> [names]
const yearsWithData = new Set();
for (const h of holidayData.holidays) {
  if (!holidayMap.has(h.date)) holidayMap.set(h.date, []);
  holidayMap.get(h.date).push(h.name);
  yearsWithData.add(Number(h.date.slice(0, 4)));
}
const periods = holidayData.periods.map((p) => ({
  name: p.name,
  start: parseDate(p.start, 'period start'),
  end: parseDate(p.end, 'period end'),
}));

const FIXED_HOLIDAYS = [
  ['01-01', "New Year's Day"],
  ['01-26', 'Republic Day'],
  ['08-15', 'Independence Day'],
  ['10-02', 'Gandhi Jayanti'],
  ['12-25', 'Christmas'],
];

function holidaysOn(ms) {
  const iso = toISO(ms);
  const year = Number(iso.slice(0, 4));
  if (yearsWithData.has(year)) return holidayMap.get(iso) || [];
  const fixed = FIXED_HOLIDAYS.find(([md]) => iso.slice(5) === md);
  return fixed ? [fixed[1]] : [];
}

function periodsOverlapping(start, end) {
  const out = periods.filter((p) => p.start <= end && p.end >= start).map((p) => p.name);
  // synthesize recurring periods for years not covered by the data file
  const years = new Set([new Date(start).getUTCFullYear(), new Date(end).getUTCFullYear()]);
  for (const y of years) {
    if (yearsWithData.has(y)) continue;
    const synth = [
      { name: 'Summer school vacation', start: Date.UTC(y, 4, 15), end: Date.UTC(y, 5, 30) },
      { name: 'Christmas–New Year holidays', start: Date.UTC(y, 11, 24), end: Date.UTC(y + 1, 0, 2) },
      { name: 'Christmas–New Year holidays', start: Date.UTC(y - 1, 11, 24), end: Date.UTC(y, 0, 2) },
    ];
    for (const p of synth) if (p.start <= end && p.end >= start) out.push(p.name);
  }
  return [...new Set(out)];
}

const PERIOD_WEIGHT = (name) => {
  if (/christmas|new year/i.test(name)) return 0.3;
  if (/diwali|puja|dussehra/i.test(name)) return 0.22;
  if (/summer/i.test(name)) return 0.2;
  return 0.15;
};

/**
 * Finds long weekends: runs of consecutive off-days (weekend or holiday) of length >= 3
 * containing a holiday. A single working day sandwiched between off-days is treated as a
 * "bridge" day (people take leave), in which case the run must be >= 4 days.
 * Returns holiday names of runs that overlap [start, end].
 */
function findLongWeekends(start, end) {
  const from = start - 4 * DAY_MS;
  const to = end + 4 * DAY_MS;
  const days = eachDay(from, to).map((t) => ({ t, hol: holidaysOn(t), off: isWeekend(t) || holidaysOn(t).length > 0 }));
  const found = [];
  let i = 0;
  while (i < days.length) {
    if (!days[i].off) { i++; continue; }
    let j = i;
    let bridged = false;
    while (j + 1 < days.length) {
      if (days[j + 1].off) { j++; continue; }
      // bridge: one working day followed by an off-day
      if (!bridged && j + 2 < days.length && days[j + 2].off) { bridged = true; j += 2; continue; }
      break;
    }
    const run = days.slice(i, j + 1);
    const names = [...new Set(run.flatMap((d) => d.hol))];
    const minLen = bridged ? 4 : 3;
    const overlaps = run[0].t <= end && run[run.length - 1].t >= start;
    if (names.length && run.length >= minLen && overlaps) found.push({ names, bridged });
    i = j + 1;
  }
  return found;
}

// ---------------------------------------------------------------------------
// getDateSignals
// ---------------------------------------------------------------------------

function getDateSignals(startDate, endDate) {
  const { start, end, days } = parseRange(startDate, endDate);
  const dayList = eachDay(start, end);

  const weekendDays = dayList.filter(isWeekend).length;
  const monthDays = {};
  for (const t of dayList) {
    const m = new Date(t).getUTCMonth() + 1;
    monthDays[m] = (monthDays[m] || 0) + 1;
  }
  const months = [...new Set(dayList.map((t) => new Date(t).getUTCMonth() + 1))];

  const holidays = [];
  for (const t of dayList) for (const name of holidaysOn(t)) holidays.push({ date: toISO(t), name });

  const periodNames = periodsOverlapping(start, end);
  const longWeekends = findLongWeekends(start, end);
  const isLongWeekend = longWeekends.length > 0;

  const weekendShare = weekendDays / days;
  const distinctHolidayNames = [...new Set(holidays.map((h) => h.name))];

  let pressure = 0.08 + 0.3 * weekendShare;
  pressure += Math.min(0.24, 0.12 * distinctHolidayNames.length);
  if (isLongWeekend) pressure += 0.22;
  if (periodNames.length) pressure += Math.max(...periodNames.map(PERIOD_WEIGHT));
  const crowdPressure = Math.round(Math.min(1, Math.max(0, pressure)) * 100) / 100;

  const notes = [];
  const lwNames = new Set();
  for (const lw of longWeekends) {
    const label = lw.names[0];
    lw.names.forEach((n) => lwNames.add(n));
    notes.push(`Overlaps ${label} long weekend${lw.bridged ? ' (with a bridge day)' : ''}`);
  }
  const otherHols = distinctHolidayNames.filter((n) => !lwNames.has(n));
  if (otherHols.length) notes.push(`Includes ${otherHols.join(', ')}`);
  for (const p of periodNames) notes.push(`During ${p}`);
  if (weekendShare <= 0.25 && !holidays.length && !isLongWeekend && !periodNames.length) {
    notes.push('Mostly weekdays — quieter');
  } else if (weekendShare >= 0.5 && days >= 2) {
    notes.push('Weekend-heavy dates — more domestic weekenders');
  }

  return {
    days,
    weekendDays,
    months,
    holidays,
    periods: periodNames,
    isLongWeekend,
    crowdPressure,
    notes,
    // extra (non-contract) fields used internally for weighting
    monthDays,
    startDate,
    endDate,
  };
}

// ---------------------------------------------------------------------------
// Destination lookup
// ---------------------------------------------------------------------------

const byName = new Map(destinations.map((d) => [d.name.toLowerCase(), d]));

function getDestinationProfile(name) {
  if (typeof name !== 'string') return null;
  return byName.get(name.trim().toLowerCase()) || null;
}

const norm = (s) => String(s).trim().toLowerCase().replace(/(es|s)$/, '');
const BUDGET_RANK = { budget: 0, mid: 1, luxury: 2 };

function toList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

function matchesInterests(profile, interests) {
  const wanted = interests.map(norm);
  return profile.types.some((t) => {
    const nt = norm(t);
    return wanted.some((w) => w && (nt === w || nt.includes(w) || w.includes(nt)));
  });
}

/**
 * Filters by interest overlap with `types` and by budget (a destination qualifies if its
 * typical budget is at or below the user's budget level). No filters -> all destinations.
 */
function listDestinations({ interests, budget } = {}) {
  const ints = toList(interests);
  const b = budget ? String(budget).toLowerCase() : null;
  return destinations.filter((d) => {
    if (ints.length && !matchesInterests(d, ints)) return false;
    if (b && b in BUDGET_RANK && BUDGET_RANK[d.budget] > BUDGET_RANK[b]) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Season / crowd scoring
// ---------------------------------------------------------------------------

function seasonOf(profile, month) {
  if (profile.peakMonths.includes(month)) return 'peak';
  if (profile.shoulderMonths.includes(month)) return 'shoulder';
  if (profile.avoidMonths.includes(month)) return 'avoid';
  return 'off';
}

function monthWeights(signals) {
  const md = signals.monthDays;
  if (md && Object.keys(md).length) {
    const total = Object.values(md).reduce((a, b) => a + b, 0);
    return Object.entries(md).map(([m, n]) => ({ month: Number(m), w: n / total }));
  }
  const ms = signals.months || [];
  return ms.map((m) => ({ month: m, w: 1 / ms.length }));
}

const SEASON_CROWD = { peak: 1.0, shoulder: 0.55, off: 0.3, avoid: 0.15 };
const SEASON_FIT = { peak: 95, shoulder: 80, off: 55, avoid: 15 };
const POPULARITY = { high: 1.0, medium: 0.65, low: 0.35 };

function dominantSeason(profile, signals) {
  const tally = {};
  for (const { month, w } of monthWeights(signals)) {
    const s = seasonOf(profile, month);
    tally[s] = (tally[s] || 0) + w;
  }
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
}

/** Events in the trip months; New Year/Christmas events only count if trip touches Dec 20–Jan 5. */
function activeEvents(profile, signals) {
  const weights = monthWeights(signals);
  let touchesYearEnd = true;
  if (signals.startDate && signals.endDate) {
    const s = parseDate(signals.startDate);
    const e = parseDate(signals.endDate);
    touchesYearEnd = eachDay(s, e).some((t) => {
      const d = new Date(t);
      const m = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      return (m === 12 && day >= 20) || (m === 1 && day <= 5);
    });
  }
  const out = [];
  for (const ev of profile.events || []) {
    const mw = weights.find((x) => x.month === ev.month);
    if (!mw) continue;
    if (/new year|christmas|year-end/i.test(ev.name) && !touchesYearEnd) continue;
    if (!out.some((o) => o.name === ev.name)) out.push({ name: ev.name, w: mw.w });
  }
  return out;
}

function computeCrowd(profile, dateSignals) {
  if (!profile || !dateSignals) throw new Error('computeCrowd requires a profile and dateSignals');
  const weights = monthWeights(dateSignals);
  const season = weights.reduce((acc, { month, w }) => acc + w * SEASON_CROWD[seasonOf(profile, month)], 0);
  const pop = POPULARITY[profile.popularity] ?? 0.65;
  const pressure = dateSignals.crowdPressure || 0;
  const events = activeEvents(profile, dateSignals);
  const eventBoost = Math.min(0.2, events.reduce((a, e) => a + 0.12 * Math.max(0.5, e.w), 0));

  // Holiday pressure is amplified at popular places and in-season.
  // Season and holiday pressure are both scaled by popularity (a quiet village in peak
  // season still doesn't get Manali-level crowds); holiday pressure is also damped off-season.
  const popScale = 0.4 + 0.6 * pop;
  const raw = 0.30 * season * popScale
    + 0.25 * pop
    + 0.30 * pressure * popScale * (0.5 + 0.5 * season)
    + eventBoost;
  const score = Math.round(Math.min(1, Math.max(0, raw)) * 100);
  const level = score >= 55 ? 'high' : score >= 33 ? 'moderate' : 'low';

  const reasons = [];
  const dom = dominantSeason(profile, dateSignals);
  if (dom === 'peak') reasons.push(`Peak season (${fmtMonths(profile.peakMonths)})`);
  else if (dom === 'shoulder') reasons.push(`Shoulder season — fewer visitors than peak (${fmtMonths(profile.peakMonths)})`);
  else if (dom === 'avoid') reasons.push('Off-season due to weather — very few tourists');
  else reasons.push('Off-season — fewer tourists');

  if (profile.popularity === 'high') reasons.push('Very popular destination');
  else if (profile.popularity === 'low') reasons.push('Offbeat spot with low tourist volume');

  for (const e of events) reasons.push(e.name);
  for (const n of dateSignals.notes || []) reasons.push(n.replace(/^Overlaps /, ''));

  return { level, score, reasons: [...new Set(reasons)] };
}

function computeSeasonFit(profile, dateSignals) {
  if (!profile || !dateSignals) throw new Error('computeSeasonFit requires a profile and dateSignals');
  const weights = monthWeights(dateSignals);
  const score = Math.round(weights.reduce((acc, { month, w }) => acc + w * SEASON_FIT[seasonOf(profile, month)], 0));
  const badMonths = weights.filter(({ month }) => profile.avoidMonths.includes(month)).map((x) => x.month);
  let warning = null;
  if (badMonths.length) {
    const when = badMonths.map((m) => MONTH_LONG[m - 1]).join(' and ');
    warning = `${profile.avoidReason || 'Poor weather'} — ${when} is best avoided`;
  }
  return { score, warning };
}

// ---------------------------------------------------------------------------
// Better-date suggestions
// ---------------------------------------------------------------------------

function shiftedSignals(start, end, deltaDays) {
  return getDateSignals(toISO(start + deltaDays * DAY_MS), toISO(end + deltaDays * DAY_MS));
}

function describeAvoided(orig, shifted) {
  const shiftedHol = new Set(shifted.holidays.map((h) => h.name));
  const xmas = orig.periods.find((p) => /christmas|new year/i.test(p) && !shifted.periods.includes(p));
  if (xmas) return `the ${xmas} rush`;
  const lw = orig.notes.find((n) => /long weekend/.test(n));
  if (lw && !shifted.isLongWeekend) return `the ${lw.replace(/^Overlaps /, '').replace(/ \(with a bridge day\)/, '')}`;
  const hol = [...new Set(orig.holidays.map((h) => h.name))].filter((n) => !shiftedHol.has(n));
  if (hol.length) return `the ${hol[0]} rush`;
  const per = orig.periods.filter((p) => !shifted.periods.includes(p));
  if (per.length) return `the ${per[0]} crowds`;
  return null;
}

function suggestBetterDates(profile, startDate, endDate) {
  if (!profile) return null;
  const { start, end } = parseRange(startDate, endDate);
  const orig = getDateSignals(startDate, endDate);
  const origCrowd = computeCrowd(profile, orig);
  const origFit = computeSeasonFit(profile, orig);
  const todayMs = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());

  let best = null;
  for (const delta of [7, -7, 14, -14]) {
    if (start + delta * DAY_MS < todayMs) continue;
    const sig = shiftedSignals(start, end, delta);
    const crowd = computeCrowd(profile, sig);
    const fit = computeSeasonFit(profile, sig);
    if (fit.score < origFit.score - 10 || (fit.warning && !origFit.warning)) continue;
    const gain = origCrowd.score - crowd.score;
    if (gain >= 15 && (!best || gain > best.gain)) best = { delta, sig, crowd, gain };
  }

  if (best) {
    const weeks = Math.abs(best.delta) / 7;
    const dir = best.delta > 0 ? 'later' : 'earlier';
    const range = fmtRange(start + best.delta * DAY_MS, end + best.delta * DAY_MS);
    const head = `Going ${weeks} week${weeks > 1 ? 's' : ''} ${dir} (${range})`;
    const avoided = describeAvoided(orig, best.sig);
    if (avoided) return `${head} avoids ${avoided}`;
    const newSeason = dominantSeason(profile, best.sig);
    if (newSeason !== dominantSeason(profile, orig) && newSeason === 'shoulder') {
      return `${head} puts you in shoulder season with far fewer crowds`;
    }
    return `${head} should be noticeably less crowded`;
  }

  // Fallback: in peak season with no nearby fix — point to the nearest shoulder month.
  if (dominantSeason(profile, orig) === 'peak' && profile.shoulderMonths.length) {
    const len = Math.round((end - start) / DAY_MS);
    const d0 = new Date(start);
    for (const k of [1, -1, 2, -2, 3, -3]) {
      const y = d0.getUTCFullYear();
      const mIdx = d0.getUTCMonth() + k;
      const cand = Date.UTC(y, mIdx, 12);
      if (cand < todayMs) continue;
      const month = new Date(cand).getUTCMonth() + 1;
      if (!profile.shoulderMonths.includes(month)) continue;
      const sig = getDateSignals(toISO(cand), toISO(cand + len * DAY_MS));
      const crowd = computeCrowd(profile, sig);
      if (origCrowd.score - crowd.score >= 15) {
        return `Mid-${MONTH_LONG[month - 1]} is shoulder season here with far fewer crowds`;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Weather (Open-Meteo archive, same calendar dates in the most recent past year)
// ---------------------------------------------------------------------------

const weatherCache = new Map();
const WEATHER_CACHE_MAX = 500;
const ARCHIVE_LAG_DAYS = 7;

function shiftYear(ms, years) {
  const d = new Date(ms);
  const y = d.getUTCFullYear() + years;
  let m = d.getUTCMonth();
  let day = d.getUTCDate();
  if (m === 1 && day === 29) day = 28; // Feb 29 -> Feb 28
  return Date.UTC(y, m, day);
}

function summarize(avgMaxC, avgMinC, rainyDays, totalRainMm, n, months) {
  const perDay = totalRainMm / n;
  const rainyShare = rainyDays / n;
  const range = `${Math.round(avgMinC)}–${Math.round(avgMaxC)}°C`;
  if (perDay >= 15 || (rainyShare >= 0.7 && perDay >= 8)) {
    const monsoon = months.some((m) => m >= 6 && m <= 9) ? 'monsoon ' : '';
    return `Heavy ${monsoon}rain expected, ${range}`;
  }
  let temp;
  if (avgMaxC >= 38) temp = 'Very hot';
  else if (avgMaxC >= 32) temp = 'Hot';
  else if (avgMaxC >= 27) temp = 'Warm';
  else if (avgMaxC >= 17) temp = avgMinC < 8 ? 'Mild days, cold nights' : 'Pleasant';
  else if (avgMaxC >= 8) temp = 'Cool';
  else if (avgMaxC >= 0) temp = 'Cold';
  else temp = 'Freezing';
  let rain;
  if (rainyShare >= 0.5) rain = 'frequent rain';
  else if (rainyShare >= 0.2) rain = 'some showers';
  else rain = 'mostly dry';
  return `${temp}, ${range}, ${rain}`;
}

async function getWeather(lat, lon, startDate, endDate) {
  try {
    const latN = Number(lat);
    const lonN = Number(lon);
    if (!Number.isFinite(latN) || !Number.isFinite(lonN)) return null;
    const { start } = parseRange(startDate, endDate);
    let end = parseDate(endDate);
    if (end - start > 13 * DAY_MS) end = start + 13 * DAY_MS; // cap to 14 days

    const now = new Date();
    const latestAvailable = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - ARCHIVE_LAG_DAYS * DAY_MS;
    let shift = 0;
    while (shiftYear(end, shift) > latestAvailable && shift > -5) shift--;
    const qStart = toISO(shiftYear(start, shift));
    const qEnd = toISO(shiftYear(end, shift));

    const key = `${latN.toFixed(3)},${lonN.toFixed(3)},${qStart},${qEnd}`;
    if (weatherCache.has(key)) return weatherCache.get(key);

    const url = 'https://archive-api.open-meteo.com/v1/archive'
      + `?latitude=${latN}&longitude=${lonN}&start_date=${qStart}&end_date=${qEnd}`
      + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto';

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    let json;
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return null;
      json = await res.json();
    } finally {
      clearTimeout(timer);
    }

    const daily = json && json.daily;
    if (!daily || !Array.isArray(daily.time)) return null;
    const maxes = (daily.temperature_2m_max || []).filter((v) => typeof v === 'number');
    const mins = (daily.temperature_2m_min || []).filter((v) => typeof v === 'number');
    const precs = (daily.precipitation_sum || []).filter((v) => typeof v === 'number');
    if (!maxes.length || !mins.length) return null;

    const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const round1 = (v) => Math.round(v * 10) / 10;
    const avgMaxC = round1(avg(maxes));
    const avgMinC = round1(avg(mins));
    const rainyDays = precs.filter((p) => p >= 1).length;
    const totalRainMm = round1(precs.reduce((a, b) => a + b, 0));
    const months = [...new Set(daily.time.map((t) => Number(String(t).slice(5, 7))))];
    const summary = summarize(avgMaxC, avgMinC, rainyDays, totalRainMm, Math.max(1, precs.length), months);

    const result = { avgMaxC, avgMinC, rainyDays, totalRainMm, summary };
    if (weatherCache.size >= WEATHER_CACHE_MAX) weatherCache.delete(weatherCache.keys().next().value);
    weatherCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

function rankDestinations({ startDate, endDate, interests, budget, avoidCrowds = false, limit = 6 } = {}) {
  const signals = getDateSignals(startDate, endDate); // validates & throws on bad input
  let pool = listDestinations({ interests, budget });
  if (!pool.length) pool = listDestinations({ budget });
  if (!pool.length) pool = destinations;

  const ranked = pool.map((profile) => {
    const crowd = computeCrowd(profile, signals);
    const seasonFit = computeSeasonFit(profile, signals);
    const totalScore = avoidCrowds
      ? seasonFit.score * 0.5 + (100 - crowd.score) * 0.5
      : seasonFit.score * 0.75 + (100 - crowd.score) * 0.25;
    return { profile, crowd, seasonFit, totalScore: Math.round(totalScore * 10) / 10 };
  });

  // Places with a season warning (monsoon, closures) always sink to the bottom.
  // When avoiding crowds, crowd level is the primary key so a "moderate" place never
  // outranks a "low" one just because it's in peak season.
  const LEVEL_RANK = { low: 0, moderate: 1, high: 2 };
  ranked.sort((a, b) =>
    (a.seasonFit.warning ? 1 : 0) - (b.seasonFit.warning ? 1 : 0)
    || (avoidCrowds ? LEVEL_RANK[a.crowd.level] - LEVEL_RANK[b.crowd.level] : 0)
    || b.totalScore - a.totalScore
    || a.crowd.score - b.crowd.score);
  const n = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.floor(Number(limit)) : 6;
  return ranked.slice(0, n);
}

module.exports = {
  getDateSignals,
  getDestinationProfile,
  listDestinations,
  computeCrowd,
  computeSeasonFit,
  suggestBetterDates,
  getWeather,
  rankDestinations,
};
