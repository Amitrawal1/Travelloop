const axios = require("axios");

const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "TraverseHub/1.0 (travel planner demo; destination image lookup)";
const TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Wikimedia rate-limits bursts; keep only a few requests in flight.
const MAX_CONCURRENT = 3;
let active = 0;
const queue = [];
function limited(fn) {
    return new Promise((resolve, reject) => {
        const run = async () => {
            active++;
            try {
                resolve(await fn());
            } catch (err) {
                reject(err);
            } finally {
                active--;
                if (queue.length) queue.shift()();
            }
        };
        if (active < MAX_CONCURRENT) run();
        else queue.push(run);
    });
}

// Set when a lookup failed for a transient reason (timeout / 429 / 5xx),
// so the miss isn't cached.
class Transient extends Error {}
const isTransient = (err) => !err.response || err.response.status === 429 || err.response.status >= 500;

// key -> { url, expires } ; also caches misses (url null) to avoid hammering
const cache = new Map();

async function fetchSummaryImage(title) {
    try {
        const { data } = await limited(() => axios.get(WIKI_SUMMARY + encodeURIComponent(title), {
            timeout: TIMEOUT_MS,
            headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        }));
        if (!data || data.type === "disambiguation") return null;
        return data.originalimage?.source || data.thumbnail?.source || null;
    } catch (err) {
        if (isTransient(err)) throw new Transient(err.message);
        return null;
    }
}

// Fallback for small places without their own article: full-text search
// (e.g. "Jibhi Himachal Pradesh" -> Banjar, India) and take the best-ranked
// hit that has a page image.
async function searchImage(query) {
    try {
        const { data } = await limited(() => axios.get(WIKI_API, {
            timeout: TIMEOUT_MS,
            headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
            params: {
                action: "query",
                generator: "search",
                gsrsearch: query,
                gsrlimit: 3,
                prop: "pageimages",
                piprop: "thumbnail",
                pithumbsize: 1280,
                format: "json",
            },
        }));
        const pages = Object.values(data?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
        const hit = pages.find((p) => p.thumbnail?.source);
        return hit ? hit.thumbnail.source : null;
    } catch (err) {
        if (isTransient(err)) throw new Transient(err.message);
        return null;
    }
}

/**
 * Look up a representative image for a destination via Wikipedia.
 * Tries "Name", then "Name, State", then a Wikipedia search for "Name State". Returns a URL string or null. Never throws.
 */
async function getDestinationImage(name, state) {
    if (!name || typeof name !== "string") return null;
    const key = `${name}|${state || ""}`.toLowerCase();
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.url;

    const titles = [name];
    if (state) titles.push(`${name}, ${state}`);

    let url = null;
    try {
        for (const t of titles) {
            url = await fetchSummaryImage(t);
            if (url) break;
        }
        if (!url) url = await searchImage(state ? `${name} ${state}` : name);
    } catch (err) {
        if (err instanceof Transient) return null; // don't cache; retry next request
        url = null;
    }
    cache.set(key, { url, expires: Date.now() + (url ? CACHE_TTL_MS : 6 * 60 * 60 * 1000) });
    return url;
}

module.exports = { getDestinationImage };
