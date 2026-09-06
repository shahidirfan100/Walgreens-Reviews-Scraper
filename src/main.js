import { Actor, log } from 'apify';
import { Dataset } from 'crawlee';
import { Impit } from 'impit';

await Actor.init();

const input = (await Actor.getInput()) || {};
const {
    url: inputUrlRaw,
    results_wanted: resultsWantedRaw,
    max_pages: maxPagesRaw,
    include_ratings_only: includeRatingsOnly = false,
    proxyConfiguration,
} = input;
const inputUrl = typeof inputUrlRaw === 'string' ? inputUrlRaw.trim() : '';

const resultsWanted =
    resultsWantedRaw != null && Number.isFinite(+resultsWantedRaw)
        ? Math.max(1, +resultsWantedRaw)
        : Number.MAX_SAFE_INTEGER;
const maxPages =
    maxPagesRaw != null && Number.isFinite(+maxPagesRaw) ? Math.max(1, +maxPagesRaw) : Number.MAX_SAFE_INTEGER;
const LIMIT = maxPages === Number.MAX_SAFE_INTEGER ? resultsWanted : Math.min(resultsWanted, maxPages * 100);

if (!inputUrl) {
    log.error('No URL provided. Please provide a Walgreens product URL.');
    await Actor.exit();
}

const isApifyCloud = Actor.isAtHome();
let proxyConf = null;
let proxyUrl;

if ((proxyConfiguration?.useApifyProxy || proxyConfiguration?.proxyUrls?.length > 0) && isApifyCloud) {
    try {
        proxyConf = await Actor.createProxyConfiguration({ ...proxyConfiguration });
        proxyUrl = await proxyConf.newUrl();
    } catch {
        log.warning('Proxy configuration could not be initialized; continuing without a proxy.');
    }
}

const impit = new Impit({
    browser: 'chrome',
    ignoreTlsErrors: true,
    ...(proxyUrl && { proxyUrl }),
});

const PASSKEY = 'tpcm2y0z48bicyt0z3et5n2xf';
const API_VERSION = '5.5';
const DISPLAY_CODE = '2001-en_us';

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

function normalizeReviews(batchResult) {
    const items = [];
    if (!batchResult?.BatchedResults?.q0?.Results) return items;
    for (const r of batchResult.BatchedResults.q0.Results) {
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

const MAX_REQUEST_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function getRetryDelay(response, attempt) {
    const retryAfter = response?.headers?.get?.('retry-after');
    if (retryAfter) {
        const seconds = Number(retryAfter);
        if (Number.isFinite(seconds) && seconds >= 0) {
            return Math.min(5000, seconds * 1000);
        }

        const retryAt = Date.parse(retryAfter);
        if (Number.isFinite(retryAt)) {
            return Math.min(5000, Math.max(0, retryAt - Date.now()));
        }
    }

    return Math.min(5000, 250 * 2 ** attempt + Math.floor(Math.random() * 100));
}

function sleep(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

async function fetchJson(apiUrl, description) {
    for (let attempt = 0; attempt <= MAX_REQUEST_RETRIES; attempt++) {
        try {
            const response = await impit.fetch(apiUrl);
            if (!response || typeof response.ok !== 'boolean') {
                throw new Error('Invalid response received');
            }

            if (!response.ok) {
                if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_REQUEST_RETRIES) {
                    const delay = getRetryDelay(response, attempt);
                    log.warning(
                        `${description} returned HTTP ${response.status}; retry ${attempt + 1}/${MAX_REQUEST_RETRIES} in ${delay}ms`,
                    );
                    await sleep(delay);
                    continue;
                }

                log.warning(`${description} returned HTTP ${response.status}; stopping this request.`);
                return null;
            }

            const contentType = response.headers?.get?.('content-type')?.toLowerCase() || '';
            const text = await response.text();
            if (!text.trim()) {
                log.warning(`${description} returned an empty response.`);
                return null;
            }
            if (contentType && !contentType.includes('json')) {
                log.warning(`${description} returned content type ${contentType}; attempting JSON parsing.`);
            }

            try {
                return JSON.parse(text);
            } catch {
                log.warning(`${description} returned malformed JSON.`);
                return null;
            }
        } catch {
            if (attempt < MAX_REQUEST_RETRIES) {
                const delay = getRetryDelay(null, attempt);
                log.warning(`${description} request failed; retry ${attempt + 1}/${MAX_REQUEST_RETRIES} in ${delay}ms`);
                await sleep(delay);
                continue;
            }

            log.warning(`${description} request failed after ${MAX_REQUEST_RETRIES + 1} attempts.`);
            return null;
        }
    }

    return null;
}

async function fetchReviews(productId, offset = 0, limit = 100) {
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

    const apiUrl = `https://api.bazaarvoice.com/data/batch.json?${params.toString()}`;
    return fetchJson(apiUrl, `Reviews request at offset ${offset}`);
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
    return fetchJson(`https://api.bazaarvoice.com/data/batch.json?${params.toString()}`, 'Product statistics request');
}

let saved = 0;

const productId = extractProductIdFromUrl(inputUrl);
if (!productId) {
    log.error(`Could not extract product ID from URL: ${inputUrl}`);
    await Actor.exit();
}
log.info(`Walgreens product ID: ${productId}`);

log.info('Fetching product statistics...');
const statsResult = await fetchProductStats(productId);
if (statsResult) {
    const products = statsResult?.BatchedResults?.q0?.Results;
    if (products && products.length > 0) {
        const product = products[0];
        log.info(`Product: ${product.Name || product.Id}`);
    }
}

log.info(
    includeRatingsOnly
        ? 'Fetching all reviews, including ratings-only entries...'
        : 'Fetching written reviews with title/text...',
);
let offset = 0;
const PAGE_SIZE = 100;
let totalAvailable = 0;

while (saved < LIMIT) {
    const result = await fetchReviews(productId, offset, PAGE_SIZE);
    if (!result) break;

    const batch = result.BatchedResults?.q0;
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

    const items = normalizeReviews(result);
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
    log.warning(
        includeRatingsOnly
            ? 'No reviews found. The product may have no reviews.'
            : 'No written reviews found. Try include_ratings_only=true to collect rating-only entries.',
    );
}

await Actor.exit();
