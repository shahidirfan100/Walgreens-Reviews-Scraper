import { Actor, log } from 'apify';
import { Dataset } from 'crawlee';
import { Impit } from 'impit';

await Actor.init();

const PASSKEY = 'tpcm2y0z48bicyt0z3et5n2xf';
const API_VERSION = '5.5';
const DISPLAY_CODE = '2001-en_us';
const API_BASE_URL = 'https://api.bazaarvoice.com/data/batch.json';
const PAGE_SIZE = 100;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 6;
const MAX_BACKOFF_MS = 4000;
const RETRYABLE_STATUSES = new Set([403, 406, 408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_PRODUCT_URL =
    'https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product';
const BROWSER_PROFILES = ['chrome', 'chrome131', 'firefox135', 'chrome124'];

const input = (await Actor.getInput()) || {};
const {
    url: inputUrlRaw,
    results_wanted: resultsWantedRaw,
    max_pages: maxPagesRaw,
    include_ratings_only: includeRatingsOnly = false,
    proxyConfiguration,
} = input;

const inputUrl = typeof inputUrlRaw === 'string' && inputUrlRaw.trim() ? inputUrlRaw.trim() : DEFAULT_PRODUCT_URL;

const resultsWanted =
    resultsWantedRaw != null && Number.isFinite(+resultsWantedRaw)
        ? Math.max(1, +resultsWantedRaw)
        : Number.MAX_SAFE_INTEGER;
const maxPages =
    maxPagesRaw != null && Number.isFinite(+maxPagesRaw) ? Math.max(1, +maxPagesRaw) : Number.MAX_SAFE_INTEGER;
const LIMIT = maxPages === Number.MAX_SAFE_INTEGER ? resultsWanted : Math.min(resultsWanted, maxPages * 100);

const isApifyCloud = Actor.isAtHome();
const hasCustomProxyUrls = Array.isArray(proxyConfiguration?.proxyUrls) && proxyConfiguration.proxyUrls.length > 0;
let proxyUrl;

if ((Boolean(proxyConfiguration?.useApifyProxy) && isApifyCloud) || hasCustomProxyUrls) {
    try {
        const proxyConf = await Actor.createProxyConfiguration({ ...proxyConfiguration });
        proxyUrl = await proxyConf.newUrl();
    } catch {
        log.warning('Proxy configuration could not be initialized; continuing without a proxy.');
    }
}

const clients = new Map();

function getClient(profile, useProxy) {
    const key = `${profile}|${useProxy ? 'proxy' : 'direct'}`;
    let client = clients.get(key);
    if (!client) {
        client = new Impit({
            browser: profile,
            ignoreTlsErrors: true,
            timeout: REQUEST_TIMEOUT_MS,
            ...(useProxy && proxyUrl ? { proxyUrl } : {}),
        });
        clients.set(key, client);
    }
    return client;
}

const transports = BROWSER_PROFILES.map((profile) => ({ profile, useProxy: false }));
if (proxyUrl) {
    for (const profile of BROWSER_PROFILES) transports.push({ profile, useProxy: true });
}
let transportCursor = 0;

function extractProductIdFromUrl(productUrl) {
    const match =
        productUrl.match(/[?/#&=]ID=([^/?#&]+?)-product/i) ||
        productUrl.match(/[?/#&=]id=([^/?#&]+?)-product/i) ||
        productUrl.match(/[?/#&=](prod\d+|\d+)(?:-product)?(?:[/?#&]|$)/i);
    return match ? match[1] : null;
}

function removeEmptyValues(value) {
    if (value === null || value === undefined || value === '') return undefined;

    if (Array.isArray(value)) {
        const cleaned = value.map(removeEmptyValues).filter((item) => item !== undefined);
        return cleaned.length > 0 ? cleaned : undefined;
    }

    if (typeof value === 'object') {
        const cleaned = Object.fromEntries(
            Object.entries(value)
                .map(([key, nestedValue]) => [key, removeEmptyValues(nestedValue)])
                .filter(([, nestedValue]) => nestedValue !== undefined),
        );
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }

    return value;
}

function extractBatch(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const batched = payload.BatchedResults;
    if (batched && typeof batched === 'object') {
        if (batched.q0 && typeof batched.q0 === 'object') return batched.q0;
        const firstKey = Object.keys(batched).find((key) => batched[key] && typeof batched[key] === 'object');
        if (firstKey) return batched[firstKey];
    }

    if (Array.isArray(payload.Results)) {
        return { Results: payload.Results, TotalResults: payload.TotalResults };
    }

    return null;
}

function normalizeReviews(batch) {
    const items = [];
    const results = Array.isArray(batch?.Results) ? batch.Results : [];
    for (const r of results) {
        if (!r || typeof r !== 'object') continue;

        const item = {
            review_id: r.Id || null,
            title: r.Title || null,
            review_text: r.ReviewText || null,
            rating: r.Rating != null ? r.Rating : null,
            rating_range: r.RatingRange != null ? r.RatingRange : null,
            user_nickname: r.UserNickname || null,
            user_location: r.UserLocation || null,
            submission_date: r.SubmissionTime || null,
            moderation_status: r.ModerationStatus || null,
            is_recommended: r.IsRecommended != null ? r.IsRecommended : null,
            is_ratings_only: r.IsRatingsOnly != null ? r.IsRatingsOnly : null,
            pros: r.Pros || null,
            cons: r.Cons || null,
            helpfulness: r.Helpfulness != null ? r.Helpfulness : null,
            total_feedback_count: r.TotalFeedbackCount != null ? r.TotalFeedbackCount : null,
            total_positive_feedback_count: r.TotalPositiveFeedbackCount != null ? r.TotalPositiveFeedbackCount : null,
            total_negative_feedback_count: r.TotalNegativeFeedbackCount != null ? r.TotalNegativeFeedbackCount : null,
            total_comment_count: r.TotalCommentCount != null ? r.TotalCommentCount : null,
            photos: (Array.isArray(r.Photos) ? r.Photos : [])
                .filter((p) => p && typeof p === 'object')
                .map((p) => ({
                    photo_id: p.Id || null,
                    caption: p.Caption || null,
                    url_normal: p.Sizes?.normal?.Url || null,
                    url_thumbnail: p.Sizes?.thumbnail?.Url || null,
                })),
            videos: (Array.isArray(r.Videos) ? r.Videos : [])
                .filter((v) => v && typeof v === 'object')
                .map((v) => ({
                    video_id: v.Id || null,
                    video_url: v.VideoUrl || null,
                    caption: v.Caption || null,
                })),
            context_data_values: r.ContextDataValues || null,
            secondary_ratings: r.SecondaryRatings || null,
            badges: r.Badges || null,
            additional_fields: r.AdditionalFields || null,
            product_id: r.ProductId || null,
            is_syndicated: r.IsSyndicated || null,
            syndication_source: r.SyndicationSource
                ? {
                      name: r.SyndicationSource.Name || null,
                      content_link: r.SyndicationSource.ContentLink || null,
                      logo_image_url: r.SyndicationSource.LogoImageUrl || null,
                  }
                : null,
            product_name: r.OriginalProductName || null,
            campaign_id: r.CampaignId || null,
            author_id: r.AuthorId || null,
            is_featured: r.IsFeatured != null ? r.IsFeatured : null,
            submission_id: r.SubmissionId || null,
            content_locale: r.ContentLocale || null,
        };
        items.push(removeEmptyValues(item));
    }
    return items;
}

function sleep(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

function getRetryDelay(response, attempt) {
    const retryAfter = response?.headers?.get?.('retry-after');
    if (retryAfter) {
        const seconds = Number(retryAfter);
        if (Number.isFinite(seconds) && seconds >= 0) {
            return Math.min(MAX_BACKOFF_MS, seconds * 1000);
        }

        const retryAt = Date.parse(retryAfter);
        if (Number.isFinite(retryAt)) {
            return Math.min(MAX_BACKOFF_MS, Math.max(0, retryAt - Date.now()));
        }
    }

    return Math.min(MAX_BACKOFF_MS, 300 * 2 ** attempt + Math.floor(Math.random() * 150));
}

async function fetchJson(apiUrl, description) {
    const maxAttempts = Math.max(1, Math.min(transports.length, MAX_ATTEMPTS));
    let lastError = 'unknown error';

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const transport = transports[(transportCursor + attempt) % transports.length];
        const label = `${transport.profile}${transport.useProxy ? '+proxy' : ''}`;
        const canRetry = attempt < maxAttempts - 1;

        try {
            const response = await getClient(transport.profile, transport.useProxy).fetch(apiUrl);

            if (!response || typeof response.ok !== 'boolean') {
                throw new Error('invalid response object');
            }

            if (!response.ok) {
                lastError = `HTTP ${response.status}`;
                if (RETRYABLE_STATUSES.has(response.status) && canRetry) {
                    const delay = getRetryDelay(response, attempt);
                    log.warning(`${description} via ${label} failed: ${lastError}; rotating profile in ${delay}ms`);
                    await sleep(delay);
                    continue;
                }
                break;
            }

            const text = await response.text();
            if (!text.trim()) {
                lastError = 'empty response body';
                if (canRetry) {
                    const delay = getRetryDelay(response, attempt);
                    log.warning(`${description} via ${label} returned an empty body; rotating profile in ${delay}ms`);
                    await sleep(delay);
                    continue;
                }
                break;
            }

            let payload;
            try {
                payload = JSON.parse(text);
            } catch {
                lastError = 'malformed JSON';
                if (canRetry) {
                    const delay = getRetryDelay(response, attempt);
                    log.warning(`${description} via ${label} returned malformed JSON; rotating profile in ${delay}ms`);
                    await sleep(delay);
                    continue;
                }
                break;
            }

            if (!extractBatch(payload)) {
                const keys = Object.keys(payload).slice(0, 8).join(', ') || 'none';
                lastError = `unexpected response shape (top-level keys: ${keys})`;
                if (canRetry) {
                    const delay = getRetryDelay(response, attempt);
                    log.warning(
                        `${description} via ${label} returned an unexpected shape; rotating profile in ${delay}ms`,
                    );
                    await sleep(delay);
                    continue;
                }
                break;
            }

            transportCursor = (transportCursor + attempt) % transports.length;
            return payload;
        } catch (error) {
            lastError = error?.message ? String(error.message) : String(error);
            if (canRetry) {
                const delay = getRetryDelay(null, attempt);
                log.warning(`${description} via ${label} errored: ${lastError}; rotating profile in ${delay}ms`);
                await sleep(delay);
                continue;
            }
            break;
        }
    }

    log.warning(`${description} failed after ${maxAttempts} attempt(s): ${lastError}`);
    return null;
}

function buildReviewsUrl(productId, offset, limit) {
    const params = new URLSearchParams({
        passkey: PASSKEY,
        apiversion: API_VERSION,
        displaycode: DISPLAY_CODE,
        'resource.q0': 'reviews',
        'limit.q0': String(limit),
        'offset.q0': String(offset),
        'sort.q0': 'submissiontime:desc',
    });

    params.append('filter.q0', `productid:eq:${productId}`);
    if (!includeRatingsOnly) {
        params.append('filter.q0', 'isratingsonly:eq:false');
    }

    return `${API_BASE_URL}?${params.toString()}`;
}

async function fetchProductStats(productId) {
    const params = new URLSearchParams({
        passkey: PASSKEY,
        apiversion: API_VERSION,
        displaycode: DISPLAY_CODE,
        'resource.q0': 'products',
        'filter.q0': `id:eq:${productId}`,
        'stats.q0': 'Reviews',
    });
    return fetchJson(`${API_BASE_URL}?${params.toString()}`, 'Product statistics request');
}

const productId = extractProductIdFromUrl(inputUrl);
if (!productId) {
    await Actor.fail(`Could not extract a product ID from the URL: ${inputUrl}`);
}
log.info(`Walgreens product ID: ${productId}`);

log.info('Fetching product statistics...');
const statsResult = await fetchProductStats(productId);
if (statsResult) {
    const products = extractBatch(statsResult)?.Results;
    const product = Array.isArray(products) ? products[0] : null;
    if (product) log.info(`Product: ${product.Name || product.Id}`);
}

log.info(
    includeRatingsOnly
        ? 'Fetching all reviews, including ratings-only entries...'
        : 'Fetching written reviews with title/text...',
);

let saved = 0;
let totalAvailable = 0;
let offset = 0;
let firstPageFailed = false;

while (saved < LIMIT) {
    const result = await fetchJson(
        buildReviewsUrl(productId, offset, PAGE_SIZE),
        `Reviews request at offset ${offset}`,
    );
    if (!result) {
        if (offset === 0) firstPageFailed = true;
        break;
    }

    const batch = extractBatch(result);
    if (!batch) {
        log.warning('Unexpected API response structure');
        break;
    }

    totalAvailable = Number.isFinite(Number(batch.TotalResults)) ? Number(batch.TotalResults) : 0;

    if (!Array.isArray(batch.Results)) {
        log.warning('Unexpected API response structure: Results is not an array.');
        break;
    }
    if (batch.Results.length === 0) break;

    const items = normalizeReviews(batch);
    log.info(`Fetched ${items.length} reviews (offset ${offset}, total ${totalAvailable})`);

    const itemsToSave = items.slice(0, Math.max(0, LIMIT - saved));
    if (itemsToSave.length > 0) {
        await Dataset.pushData(itemsToSave);
        saved += itemsToSave.length;
        log.info(`Saved ${itemsToSave.length} reviews. Total: ${saved}`);
    }

    if (items.length < PAGE_SIZE) break;

    offset += PAGE_SIZE;
    if (offset >= totalAvailable) break;
}

log.info(`Finished. Collected ${saved} reviews for product ${productId}`);

if (saved === 0) {
    if (firstPageFailed) {
        await Actor.fail(`Failed to retrieve any reviews for product ${productId}: all requests failed.`);
    }
    log.warning(
        includeRatingsOnly
            ? 'No reviews found. The product may have no reviews.'
            : 'No written reviews found. Try include_ratings_only=true to collect rating-only entries.',
    );
}

await Actor.exit();
