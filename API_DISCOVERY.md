# API Discovery: Walgreens Bazaarvoice Reviews

## Discovery Method

URLScan.io public scan review plus direct Bazaarvoice replay. A prior browser interception identified XHR requests to `api.bazaarvoice.com`; this pass re-tested the failing Walgreens URL directly and confirmed the written-review filter needed for populated title/text fields.

## Discovery Steps

1. Loaded `https://www.walgreens.com/store/c/walgreens-vitamin-d3-50-mcg-(2000-iu)-softgels-(75-days)/ID=300428282-product` in Firefox via Playwright
2. Observed the page making a batch request to `https://api.bazaarvoice.com/data/batch.json` with query parameters containing the product ID, passkey, display code, and filter/sort/pagination params
3. Copied the full request URL and verified it returns review data directly via `impit` without any special headers or cookies (zero browser overhead)
4. Cross-checked against Walgreens product page URL patterns to confirm the numeric product ID (e.g., `300428282` from `/ID=300428282-product`)

## Endpoint Details

| Property       | Value                                             |
| -------------- | ------------------------------------------------- |
| Base URL       | `https://api.bazaarvoice.com/data/batch.json`     |
| Method         | `GET`                                             |
| Authentication | Passkey query param (`tpcm2y0z48bicyt0z3et5n2xf`) |
| Content Type   | `application/json`                                |

## Required Parameters

| Parameter     | Value                       | Description                                                                |
| ------------- | --------------------------- | -------------------------------------------------------------------------- |
| `passkey`     | `tpcm2y0z48bicyt0z3et5n2xf` | Bazaarvoice API key                                                        |
| `apiversion`  | `5.5`                       | API version                                                                |
| `displaycode` | `2001-en_us`                | Walgreens locale/display code                                              |
| `resource.q0` | `reviews`                   | Resource type (reviews, products, stats)                                   |
| `filter.q0`   | `productid:eq:{PRODUCT_ID}` | Filter by product ID                                                       |
| `filter.q0`   | `isratingsonly:eq:false`    | Default filter used by the actor to return written reviews with title/text |
| `limit.q0`    | `100`                       | Results per page (max 100)                                                 |
| `offset.q0`   | `0`                         | Pagination offset                                                          |
| `sort.q0`     | `submissiontime:desc`       | Sort order                                                                 |

## Candidate Matrix

| Candidate                                                                                                                     | Header Profile       | Status/body              | Fields                                                                                                                          | Pagination                      | Decision                                      |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------- |
| `api.bazaarvoice.com/data/batch.json?resource.q0=reviews&filter.q0=productid:eq:prod6177789&filter.q0=isratingsonly:eq:false` | None (default impit) | 200 / 53 written reviews | 30+ (Id, Title, ReviewText, Rating, UserNickname, UserLocation, SubmissionTime, Photos, Videos, Badges, SecondaryRatings, etc.) | offset/limit (max 100 per page) | **selected for written review extraction**    |
| `api.bazaarvoice.com/data/batch.json?resource.q0=reviews&filter.q0=productid:eq:prod6177789`                                  | None (default impit) | 200 / 232 reviews        | 30+ but many newest rows are ratings-only with null Title/ReviewText/UserNickname                                               | offset/limit (max 100 per page) | available behind `include_ratings_only=true`  |
| `api.bazaarvoice.com/data/batch.json?resource.q0=reviews&filter.q0=productid:eq:300428282`                                    | None (default impit) | 200 / 178 reviews        | 30+ (Id, Title, ReviewText, Rating, UserNickname, UserLocation, SubmissionTime, Photos, Videos, Badges, SecondaryRatings, etc.) | offset/limit (max 100 per page) | **selected**                                  |
| Walgreens product page HTML                                                                                                   | Chrome browser       | 200 / full DOM           | ~5 (product name, price, rating stars)                                                                                          | None                            | rejected (JS-rendered, no inline review data) |
| Walgreens next-day-ssg data                                                                                                   | —                    | 404 / empty              | —                                                                                                                               | —                               | rejected                                      |

## Re-Tested Failing URL

Target:

```
https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product
```

Findings:

- The product ID is alphanumeric: `prod6177789`. Numeric variants such as `6177789` and UPC-like values returned 0 reviews.
- Unfiltered reviews returned `TotalResults: 232`, but the newest rows include ratings-only entries with `Title: null`, `ReviewText: null`, and `UserNickname: null`.
- Adding `filter.q0=isratingsonly:eq:false` returned `TotalResults: 53`, and all tested rows had populated written-review fields such as `Title`, `ReviewText`, and `UserNickname`.
- Product stats endpoint works with `filter.q0=id:eq:prod6177789` and returned product name `Maximum Hydration Nourishing Body Lotion Aloe Vera`.

## Response Structure

```json
{
    "BatchedResults": {
        "q0": {
            "TotalResults": 178,
            "Results": [
                {
                    "Id": "398340318",
                    "Title": null,
                    "ReviewText": null,
                    "Rating": 5,
                    "RatingRange": 5,
                    "UserNickname": null,
                    "UserLocation": null,
                    "SubmissionTime": "2026-07-19T18:43:33.000+00:00",
                    "ModerationStatus": "APPROVED",
                    "IsRatingsOnly": true,
                    "Badges": {
                        "verifiedPurchaser": {
                            "ContentType": "REVIEW",
                            "Id": "verifiedPurchaser",
                            "BadgeType": "Custom"
                        }
                    },
                    "ProductId": "300428282",
                    "OriginalProductName": "Vitamin D3 50 mcg (2000 IU) Softgels (75 days)",
                    "AuthorId": "t8jkegxo5hwpp8cy63wa4rda7",
                    "CampaignId": "BV_PIE_FOLLOWUP_MPR",
                    "ContentLocale": "en_US"
                }
            ]
        }
    }
}
```

## Product Info API

A separate stats/products resource provides product-level data:

```
https://api.bazaarvoice.com/data/batch.json
  ?passkey=tpcm2y0z48bicyt0z3et5n2xf
  &apiversion=5.5
  &displaycode=2001-en_us
  &resource.q0=products
  &filter.q0=id:eq:{PRODUCT_ID}
  &stats.q0=Reviews
```

Returns product name, average rating, review count, and other metadata.

## Verification Results

| Check                                           | Result                                               |
| ----------------------------------------------- | ---------------------------------------------------- |
| API returns reviews without cookies/headers     | ✅                                                   |
| Pagination via offset (0, 100, ...)             | ✅ — page 1: 100 items, page 2: 78 items (total 178) |
| Different product IDs work                      | ✅ — returns TotalResults per product                |
| Works cross-origin (no CORS restriction)        | ✅ — API is fully public                             |
| No rate limiting detected (rapid-fire requests) | ✅ — consecutive calls succeed                       |

## URL Product ID Extraction

Walgreens product URLs can use numeric IDs or alphanumeric `prod...` IDs:

```
/ID=300428282-product
/ID=359377-product
/ID=prod6177789-product
```

Extraction must preserve the full value between `ID=` and `-product`; for example `prod6177789`, not just the numeric suffix.
