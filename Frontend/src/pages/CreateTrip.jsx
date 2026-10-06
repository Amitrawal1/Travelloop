import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CalendarCheck,
    CloudSun,
    Compass,
    IndianRupee,
    Info,
    Loader2,
    MapPin,
    Minus,
    Plus,
    Sparkles,
    Users,
    Wand2,
} from "lucide-react";
import bgVideo from "../assets/videos/travel-bg.mp4";
import { createTrip, generateSuggestions, getDestinations } from "../api";

const INTERESTS = ["mountains", "beach", "heritage", "spiritual", "wildlife", "adventure", "offbeat", "food"];
const BUDGETS = [
    { value: "budget", label: "Budget" },
    { value: "mid", label: "Mid-range" },
    { value: "luxury", label: "Luxury" },
];
const CROWD_STYLES = {
    low: { label: "Low crowd", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40", dot: "bg-emerald-400" },
    moderate: { label: "Moderate crowd", cls: "bg-amber-500/15 text-amber-300 border-amber-400/40", dot: "bg-amber-400" },
    high: { label: "High crowd", cls: "bg-red-500/15 text-red-300 border-red-400/40", dot: "bg-red-400" },
};
const CROWD_RANK = { low: 0, moderate: 1, high: 2 };

const toISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};
const normalize = (s = "") => s.trim().toLowerCase();
const formatHolidayDate = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const errorMessage = (err, fallback) => {
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.response) return `${fallback} (server error ${err.response.status}).`;
    if (err?.request) return "Couldn't reach the server. Check your connection or that the backend is running.";
    return fallback;
};

function CrowdBadge({ level }) {
    const style = CROWD_STYLES[level] || CROWD_STYLES.moderate;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${style.cls}`}>
            <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
            {style.label}
        </span>
    );
}

function DestinationImage({ src, alt }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-[#a3ff00]/25 via-emerald-900/40 to-black flex items-center justify-center" role="img" aria-label={alt}>
                <MapPin className="w-10 h-10 text-[#a3ff00]/80" aria-hidden="true" />
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
        />
    );
}

function SuggestionCard({ s, index, highlighted, cardRef, onAlternativeClick, onPlan, planState }) {
    const crowd = s.crowd || {};
    const w = s.weather;
    return (
        <motion.article
            ref={cardRef}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`group rounded-3xl overflow-hidden border bg-black/40 shadow-xl flex flex-col sm:flex-row transition-all duration-500 ${highlighted ? "border-[#a3ff00] ring-2 ring-[#a3ff00]/60 shadow-[0_0_30px_rgba(163,255,0,0.35)]" : "border-white/10"}`}
        >
            <div className="relative h-44 sm:h-auto sm:w-48 md:w-56 flex-shrink-0 overflow-hidden">
                <DestinationImage src={s.image} alt={`${s.name}, ${s.state}`} />
                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold text-[#a3ff00]">
                    #{index + 1}
                </span>
            </div>

            <div className="flex-1 p-5 flex flex-col gap-3 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-bold text-xl text-white leading-tight">{s.name}</h3>
                        <p className="text-sm text-white/60 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {s.state}
                        </p>
                    </div>
                    <CrowdBadge level={crowd.level} />
                </div>

                {s.tagline && <p className="text-sm text-white/80 italic">{s.tagline}</p>}

                {Array.isArray(crowd.reasons) && crowd.reasons.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Crowd forecast reasons">
                        {crowd.reasons.map((r) => (
                            <li key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                                {r}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
                    {w && (
                        <span className="flex items-center gap-1.5">
                            <CloudSun className="w-4 h-4 text-sky-300" aria-hidden="true" />
                            {w.avgMinC != null && w.avgMaxC != null ? `${Math.round(w.avgMinC)}–${Math.round(w.avgMaxC)}°C` : ""}
                            {w.rainyDays != null ? ` · ${w.rainyDays} rainy day${w.rainyDays === 1 ? "" : "s"}` : ""}
                            {w.summary ? ` · ${w.summary}` : ""}
                        </span>
                    )}
                    {s.estimatedCostPerPerson && (
                        <span className="flex items-center gap-1.5">
                            <IndianRupee className="w-4 h-4 text-[#a3ff00]" aria-hidden="true" />
                            {s.estimatedCostPerPerson} / person
                        </span>
                    )}
                </div>

                {s.why && <p className="text-sm text-white/85 leading-relaxed">{s.why}</p>}

                {s.seasonWarning && (
                    <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2 flex gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{s.seasonWarning}</span>
                    </p>
                )}

                {s.betterDates && (
                    <p className="text-sm text-sky-200 bg-sky-500/10 border border-sky-400/30 rounded-xl px-3 py-2 flex gap-2">
                        <CalendarCheck className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span><span className="font-semibold">Better dates:</span> {s.betterDates}</span>
                    </p>
                )}

                {s.alternative && (
                    <button
                        type="button"
                        onClick={() => onAlternativeClick(s.alternative)}
                        className="text-left text-sm bg-[#a3ff00]/10 border border-[#a3ff00]/30 hover:bg-[#a3ff00]/15 rounded-xl px-3 py-2 transition-colors"
                    >
                        <span className="font-semibold text-[#a3ff00]">Less crowded alternative:</span>{" "}
                        <span className="text-white font-semibold">{s.alternative.name}</span>
                        {s.alternative.state ? <span className="text-white/60">, {s.alternative.state}</span> : null}
                        {s.alternative.crowdLevel ? (
                            <span className="text-white/70"> ({CROWD_STYLES[s.alternative.crowdLevel]?.label || s.alternative.crowdLevel})</span>
                        ) : null}
                        {s.alternative.why ? <span className="text-white/70"> — {s.alternative.why}</span> : null}
                    </button>
                )}

                <div className="mt-auto pt-2 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => onPlan(s)}
                        disabled={planState?.saving}
                        className="self-start bg-[#a3ff00] hover:bg-[#b5ff33] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {planState?.saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
                        {planState?.saving ? "Saving..." : "Plan this trip"}
                    </button>
                    {planState?.error && (
                        <p role="alert" className="text-sm text-red-300">{planState.error}</p>
                    )}
                </div>
            </div>
        </motion.article>
    );
}

function CreateTrip() {
    const navigate = useNavigate();
    const today = useMemo(() => toISODate(new Date()), []);

    // Form state
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [place, setPlace] = useState("");
    const [interests, setInterests] = useState([]);
    const [budget, setBudget] = useState("mid");
    const [travelers, setTravelers] = useState(2);
    const [avoidCrowds, setAvoidCrowds] = useState(true);
    const [destinations, setDestinations] = useState([]);

    // Result state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null); // { source, dateSignals, suggestions }
    const [highlighted, setHighlighted] = useState(null);
    const [altNotice, setAltNotice] = useState(null);
    const [planStates, setPlanStates] = useState({});

    const cardRefs = useRef({});
    const highlightTimer = useRef(null);

    useEffect(() => {
        let active = true;
        getDestinations()
            .then((res) => {
                if (active && Array.isArray(res.data?.destinations)) setDestinations(res.data.destinations);
            })
            .catch(() => { /* autocomplete is optional */ });
        return () => {
            active = false;
            clearTimeout(highlightTimer.current);
        };
    }, []);

    const sortedSuggestions = useMemo(() => {
        const list = result?.suggestions || [];
        if (!avoidCrowds) return list;
        return list
            .map((s, i) => ({ s, i }))
            .sort((a, b) => {
                const ra = CROWD_RANK[a.s.crowd?.level] ?? 1;
                const rb = CROWD_RANK[b.s.crowd?.level] ?? 1;
                return ra - rb || a.i - b.i;
            })
            .map(({ s }) => s);
    }, [result, avoidCrowds]);

    const toggleInterest = (i) =>
        setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

    const handleStartChange = (value) => {
        setStartDate(value);
        if (endDate && value && endDate < value) setEndDate(value);
    };

    const handleGenerate = async (e) => {
        e?.preventDefault();
        setError("");
        if (!startDate || !endDate) {
            setError("Please choose both a start and an end date.");
            return;
        }
        if (startDate < today) {
            setError("Start date can't be in the past.");
            return;
        }
        if (endDate < startDate) {
            setError("End date must be on or after the start date.");
            return;
        }

        const payload = { startDate, endDate, budget, travelers, avoidCrowds };
        if (place.trim()) payload.place = place.trim();
        if (interests.length) payload.interests = interests;

        try {
            setLoading(true);
            setAltNotice(null);
            setHighlighted(null);
            setPlanStates({});
            const res = await generateSuggestions(payload);
            const data = res.data || {};
            if (data.success === false) {
                setError(data.message || "Couldn't generate suggestions.");
                setResult(null);
                return;
            }
            setResult({
                source: data.source,
                dateSignals: data.dateSignals || null,
                suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
            });
        } catch (err) {
            setResult(null);
            setError(errorMessage(err, "Couldn't generate suggestions. Please try again"));
        } finally {
            setLoading(false);
        }
    };

    const handleAlternativeClick = (alt) => {
        const key = normalize(alt.name);
        const el = cardRefs.current[key];
        if (el) {
            setAltNotice(null);
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlighted(key);
            clearTimeout(highlightTimer.current);
            highlightTimer.current = setTimeout(() => setHighlighted(null), 2500);
        } else {
            setAltNotice(alt);
        }
    };

    const handlePlan = async (s) => {
        const key = normalize(s.name);
        if (!localStorage.getItem("token")) {
            navigate("/auth");
            return;
        }
        setPlanStates((p) => ({ ...p, [key]: { saving: true, error: "" } }));
        try {
            await createTrip({
                name: `Trip to ${s.name}`,
                destination: s.state ? `${s.name}, ${s.state}` : s.name,
                startDate,
                endDate,
                description: s.why || s.tagline || "",
                image: s.image || "",
            });
            navigate("/dashboard");
        } catch (err) {
            if (err?.response?.status === 401) {
                navigate("/auth");
                return;
            }
            setPlanStates((p) => ({ ...p, [key]: { saving: false, error: errorMessage(err, "Couldn't save this trip") } }));
        }
    };

    const signals = result?.dateSignals;
    const hasSignals = signals && ((signals.notes?.length ?? 0) > 0 || (signals.holidays?.length ?? 0) > 0);
    const signalsCrowded = signals && (signals.isLongWeekend || (signals.holidays?.length ?? 0) > 0);

    const inputCls =
        "w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 outline-none focus:border-[#a3ff00]/50 focus:ring-1 focus:ring-[#a3ff00]/50 transition-all text-white placeholder-white/30";

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-black text-white font-sans">
            {/* Background Video */}
            <video
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
                className="fixed inset-0 w-full h-full object-cover opacity-70 pointer-events-none"
            >
                <source src={bgVideo} type="video/mp4" />
            </video>
            <div className="fixed inset-0 bg-gradient-to-br from-black/90 via-black/60 to-black/90 backdrop-blur-sm pointer-events-none"></div>

            <div className="relative z-10 px-4 py-6 sm:p-6 md:p-10 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pt-2">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                            Where should we go?
                        </h1>
                        <p className="text-white/60 mt-2 text-sm md:text-base">
                            Pick your dates — we&apos;ll find the best places in India for them, and how crowded they&apos;ll be.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="bg-white/10 border border-white/20 px-4 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-lg hover:bg-white/20 transition hover:scale-105 text-sm md:text-base font-medium shadow-xl flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back To Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 pb-10">
                    {/* Form */}
                    <motion.form
                        onSubmit={handleGenerate}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-5 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2rem] p-5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden h-fit lg:sticky lg:top-6"
                        noValidate
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#a3ff00]/5 to-transparent pointer-events-none"></div>

                        <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-2 relative">
                            <Compass className="w-6 h-6 text-[#a3ff00]" aria-hidden="true" />
                            Your trip
                        </h2>

                        <div className="space-y-5 relative">
                            {/* Dates */}
                            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="ct-start" className="block mb-2 text-sm font-medium text-white/80">Start date</label>
                                    <input
                                        id="ct-start"
                                        type="date"
                                        required
                                        min={today}
                                        value={startDate}
                                        onChange={(e) => handleStartChange(e.target.value)}
                                        className={`${inputCls} [color-scheme:dark]`}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ct-end" className="block mb-2 text-sm font-medium text-white/80">End date</label>
                                    <input
                                        id="ct-end"
                                        type="date"
                                        required
                                        min={startDate || today}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className={`${inputCls} [color-scheme:dark]`}
                                    />
                                </div>
                            </div>

                            {/* Place */}
                            <div>
                                <label htmlFor="ct-place" className="block mb-2 text-sm font-medium text-white/80">
                                    Region or vibe <span className="text-white/40 font-normal">(optional)</span>
                                </label>
                                <input
                                    id="ct-place"
                                    type="text"
                                    list="ct-destinations"
                                    value={place}
                                    onChange={(e) => setPlace(e.target.value)}
                                    placeholder="e.g. Himachal, quiet beach, South India"
                                    className={inputCls}
                                />
                                <datalist id="ct-destinations">
                                    {destinations.map((d) => (
                                        <option key={`${d.name}-${d.state}`} value={d.name}>{d.state}</option>
                                    ))}
                                </datalist>
                            </div>

                            {/* Interests */}
                            <fieldset>
                                <legend className="mb-2 text-sm font-medium text-white/80">Interests</legend>
                                <div className="flex flex-wrap gap-2">
                                    {INTERESTS.map((i) => {
                                        const on = interests.includes(i);
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                aria-pressed={on}
                                                onClick={() => toggleInterest(i)}
                                                className={`px-3 py-1.5 rounded-full text-sm capitalize border transition-colors ${on ? "bg-[#a3ff00] text-black border-[#a3ff00] font-semibold" : "bg-black/30 border-white/15 text-white/80 hover:border-[#a3ff00]/50"}`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    })}
                                </div>
                            </fieldset>

                            {/* Budget + travelers */}
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                                <fieldset>
                                    <legend className="mb-2 text-sm font-medium text-white/80">Budget</legend>
                                    <div className="grid grid-cols-3 bg-black/40 border border-white/10 rounded-2xl p-1" role="radiogroup" aria-label="Budget">
                                        {BUDGETS.map((b) => (
                                            <button
                                                key={b.value}
                                                type="button"
                                                role="radio"
                                                aria-checked={budget === b.value}
                                                onClick={() => setBudget(b.value)}
                                                className={`py-2 rounded-xl text-sm transition-colors ${budget === b.value ? "bg-[#a3ff00] text-black font-semibold" : "text-white/70 hover:text-white"}`}
                                            >
                                                {b.label}
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>
                                <div>
                                    <span id="ct-travelers-label" className="block mb-2 text-sm font-medium text-white/80">Travelers</span>
                                    <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl p-1 w-fit" role="group" aria-labelledby="ct-travelers-label">
                                        <button
                                            type="button"
                                            aria-label="Fewer travelers"
                                            disabled={travelers <= 1}
                                            onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
                                        >
                                            <Minus className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                        <span className="w-12 text-center font-semibold flex items-center justify-center gap-1" aria-live="polite">
                                            <Users className="w-3.5 h-3.5 text-white/50" aria-hidden="true" />
                                            {travelers}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label="More travelers"
                                            disabled={travelers >= 20}
                                            onClick={() => setTravelers((t) => Math.min(20, t + 1))}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
                                        >
                                            <Plus className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Avoid crowds toggle */}
                            <div className="flex items-center justify-between gap-4 bg-black/40 border border-[#a3ff00]/25 rounded-2xl p-4">
                                <div>
                                    <p id="ct-avoid-label" className="font-semibold text-white">Avoid crowded places</p>
                                    <p id="ct-avoid-desc" className="text-xs text-white/55 mt-0.5">Pushes places with a high crowd forecast down the list.</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={avoidCrowds}
                                    aria-labelledby="ct-avoid-label"
                                    aria-describedby="ct-avoid-desc"
                                    onClick={() => setAvoidCrowds((v) => !v)}
                                    className={`relative flex-shrink-0 w-14 h-8 rounded-full transition-colors ${avoidCrowds ? "bg-[#a3ff00]" : "bg-white/20"}`}
                                >
                                    <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-black shadow transition-transform ${avoidCrowds ? "translate-x-6" : ""}`} />
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div role="alert" className="mt-5 relative text-sm text-red-200 bg-red-500/15 border border-red-400/40 rounded-xl px-3 py-2 flex gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-full bg-[#a3ff00] hover:bg-[#b5ff33] text-black font-bold py-4 rounded-2xl text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(163,255,0,0.3)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 relative flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Finding places...</>
                            ) : (
                                <><Wand2 className="w-5 h-5" aria-hidden="true" /> Find the best places</>
                            )}
                        </button>
                    </motion.form>

                    {/* Results */}
                    <motion.section
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        aria-busy={loading}
                        aria-label="Suggested places"
                        className="lg:col-span-7 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col min-h-[500px]"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-[#a3ff00]" aria-hidden="true" />
                                Suggested places
                            </h2>
                            {result && !loading && result.suggestions.length > 0 && (
                                <span
                                    className="text-xs px-2.5 py-1 rounded-full border border-white/15 bg-black/30 text-white/70"
                                    title={result.source === "ai" ? "Ranked by AI using your dates and preferences" : "Estimated from season, holiday and weekend data"}
                                >
                                    {result.source === "ai" ? "AI-ranked" : "Smart estimate"}
                                </span>
                            )}
                        </div>

                        {/* Date insight strip */}
                        {hasSignals && !loading && (
                            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${signalsCrowded ? "bg-amber-500/10 border-amber-400/30 text-amber-100" : "bg-white/5 border-white/10 text-white/80"}`}>
                                <div className="flex gap-2">
                                    {signalsCrowded
                                        ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-300" aria-hidden="true" />
                                        : <CalendarDays className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#a3ff00]" aria-hidden="true" />}
                                    <div className="space-y-1">
                                        {(signals.notes || []).map((n) => (
                                            <p key={n}>
                                                {n}
                                                {signalsCrowded && /holiday|weekend|diwali|holi|festival/i.test(n) ? " — expect crowds at popular spots." : ""}
                                            </p>
                                        ))}
                                        {(signals.holidays?.length ?? 0) > 0 && (
                                            <p className="text-xs opacity-80">
                                                Holidays in range: {signals.holidays.map((h) => `${h.name} (${formatHolidayDate(h.date)})`).join(", ")}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 relative">
                            {!result && !loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 min-h-[350px]"
                                >
                                    <div className="w-24 h-24 mb-6 relative">
                                        <div className="absolute inset-0 bg-[#a3ff00]/20 rounded-full animate-ping"></div>
                                        <div className="relative bg-black/50 border border-white/10 w-full h-full rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(163,255,0,0.2)]">
                                            <Compass className="w-12 h-12 text-[#a3ff00]" aria-hidden="true" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-3">Ready to explore?</h3>
                                    <p className="text-white/50 max-w-sm text-base md:text-lg leading-relaxed">
                                        Choose your dates and we&apos;ll recommend Indian destinations that are at their best — with a crowd forecast for each.
                                    </p>
                                </motion.div>
                            )}

                            {loading && (
                                <div className="grid grid-cols-1 gap-4 pb-4" aria-hidden="true">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-56 rounded-3xl overflow-hidden relative bg-white/5 animate-pulse border border-white/5">
                                            <div className="absolute bottom-4 left-4 right-4 space-y-3">
                                                <div className="h-6 bg-white/20 rounded-lg w-1/2"></div>
                                                <div className="h-4 bg-white/10 rounded-lg w-3/4"></div>
                                                <div className="h-4 bg-white/10 rounded-lg w-2/3"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {result && !loading && sortedSuggestions.length === 0 && (
                                <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 min-h-[300px]">
                                    <MapPin className="w-10 h-10 text-white/40 mb-4" aria-hidden="true" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No matches for these filters</h3>
                                    <p className="text-white/50 max-w-sm">Try fewer interests, a different region or vibe, or other dates.</p>
                                </div>
                            )}

                            {result && !loading && sortedSuggestions.length > 0 && (
                                <>
                                    <AnimatePresence>
                                        {altNotice && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                className="mb-4 rounded-2xl border border-[#a3ff00]/40 bg-[#a3ff00]/10 px-4 py-3 text-sm flex items-start justify-between gap-3"
                                            >
                                                <div>
                                                    <p className="font-semibold text-white flex flex-wrap items-center gap-2">
                                                        {altNotice.name}{altNotice.state ? `, ${altNotice.state}` : ""}
                                                        {altNotice.crowdLevel && <CrowdBadge level={altNotice.crowdLevel} />}
                                                    </p>
                                                    {altNotice.why && <p className="text-white/75 mt-1">{altNotice.why}</p>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setAltNotice(null)}
                                                    className="text-white/60 hover:text-white text-xs underline flex-shrink-0"
                                                >
                                                    Dismiss
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="grid grid-cols-1 gap-4 md:gap-5 pb-2">
                                        {sortedSuggestions.map((s, index) => {
                                            const key = normalize(s.name);
                                            return (
                                                <SuggestionCard
                                                    key={`${key}-${s.state}`}
                                                    s={s}
                                                    index={index}
                                                    highlighted={highlighted === key}
                                                    cardRef={(el) => {
                                                        if (el) cardRefs.current[key] = el;
                                                        else delete cardRefs.current[key];
                                                    }}
                                                    onAlternativeClick={handleAlternativeClick}
                                                    onPlan={handlePlan}
                                                    planState={planStates[key]}
                                                />
                                            );
                                        })}
                                    </div>

                                    <p className="mt-5 text-xs text-white/45 flex gap-1.5">
                                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px" aria-hidden="true" />
                                        Crowd levels are forecasts based on season, public holidays and weekends — not live data.
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
}

export default CreateTrip;
