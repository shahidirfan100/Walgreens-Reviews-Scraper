## What does Walgreens Reviews Scraper do?

Walgreens Reviews Scraper collects public customer reviews from Walgreens product pages and returns structured review data for product research, sentiment analysis, brand monitoring, competitor analysis, and retail analytics. Provide one Walgreens product URL, set the review limit, and receive records with ratings, review text, reviewer details, dates, media, badges, and product identifiers.

The Actor supports numeric product IDs such as `300428282` and alphanumeric IDs such as `prod6177789`. Written reviews are collected by default. You can also include ratings-only entries when you need the broadest available review history.

## Why use Walgreens Reviews Scraper?

- **Customer feedback research** - Collect review titles, full text, star ratings, recommendations, pros, cons, and helpfulness signals in one dataset.
- **Brand and competitor monitoring** - Track new feedback, recurring complaints, product strengths, and changes in customer perception.
- **Product quality analysis** - Compare ratings, review themes, reviewer locations, badges, and syndicated content across Walgreens products.
- **Media and metadata collection** - Preserve review photos, videos, secondary ratings, campaign details, and source information when Walgreens publishes them.
- **Automation-ready output** - Download JSON, CSV, Excel, or XML, use the Apify API, schedule repeat runs, and connect completed runs to webhooks or workflow tools.

## What data can you extract from Walgreens reviews?

| Field                           | Type    | Description                                                   |
| ------------------------------- | ------- | ------------------------------------------------------------- |
| `review_id`                     | String  | Unique review identifier.                                     |
| `title`                         | String  | Review headline.                                              |
| `review_text`                   | String  | Full customer review text.                                    |
| `rating`                        | Number  | Star rating assigned to the review.                           |
| `rating_range`                  | Number  | Maximum rating value, normally 5.                             |
| `user_nickname`                 | String  | Public reviewer nickname when available.                      |
| `user_location`                 | String  | Reviewer location when published.                             |
| `submission_date`               | String  | Review submission timestamp.                                  |
| `moderation_status`             | String  | Published moderation status.                                  |
| `is_recommended`                | Boolean | Recommendation signal when available.                         |
| `is_ratings_only`               | Boolean | Whether the record contains a rating without written content. |
| `pros`                          | String  | Positive points supplied with the review.                     |
| `cons`                          | String  | Negative points supplied with the review.                     |
| `helpfulness`                   | Number  | Helpfulness value when available.                             |
| `total_feedback_count`          | Number  | Total helpfulness feedback votes.                             |
| `total_positive_feedback_count` | Number  | Positive feedback vote count.                                 |
| `total_negative_feedback_count` | Number  | Negative feedback vote count.                                 |
| `total_comment_count`           | Number  | Number of comments on the review.                             |
| `photos`                        | Array   | Attached photo IDs, captions, and image URLs.                 |
| `videos`                        | Array   | Attached video IDs, URLs, and captions.                       |
| `secondary_ratings`             | Object  | Additional rating dimensions published by the source.         |
| `badges`                        | Object  | Review badges such as verified purchaser labels.              |
| `context_data_values`           | Object  | Additional review context when available.                     |
| `additional_fields`             | Object  | Extra source fields supplied with the review.                 |
| `product_id`                    | String  | Walgreens product identifier.                                 |
| `product_name`                  | String  | Product name associated with the review.                      |
| `is_syndicated`                 | Boolean | Whether the review comes from another source.                 |
| `syndication_source`            | Object  | Name, content link, and logo for syndicated content.          |
| `campaign_id`                   | String  | Source campaign identifier when available.                    |
| `author_id`                     | String  | Source author identifier when available.                      |
| `is_featured`                   | Boolean | Whether the review is featured.                               |
| `submission_id`                 | String  | Source submission identifier when available.                  |
| `content_locale`                | String  | Review content locale.                                        |

Unavailable source values are omitted from individual records. This keeps the dataset compact while preserving fields that Walgreens publishes.

## How to use Walgreens Reviews Scraper

1. Open the Actor in Apify Console.
2. Enter a complete public Walgreens product URL containing `/ID=...-product`.
3. Set `results_wanted` for the number of records to save.
4. Leave `include_ratings_only` disabled for written reviews, or enable it to include star-only ratings.
5. Run the Actor and preview the dataset.
6. Download the results or connect the dataset to an API, schedule, webhook, or automation workflow.

## Input Parameters

| Parameter              | Type    | Required | Default             | Description                                                                       |
| ---------------------- | ------- | -------- | ------------------- | --------------------------------------------------------------------------------- |
| `url`                  | String  | No       | Example product URL | Full Walgreens product page URL. Numeric and `prod...` product IDs are supported. |
| `results_wanted`       | Integer | No       | `20`                | Maximum number of reviews to save. Increase this value to collect more reviews.   |
| `max_pages`            | Integer | No       | `20`                | Maximum number of review pages to request, with up to 100 records per page.       |
| `include_ratings_only` | Boolean | No       | `false`             | Prefer written reviews. Falls back to ratings-only entries when none exist.       |
| `proxyConfiguration`   | Object  | No       | No proxy            | Optional proxy settings for larger, scheduled, or repeated runs.                  |

## Usage Examples

### Basic written review collection

Collect up to 20 written reviews from a Walgreens product page:

```json
{
    "url": "https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product",
    "results_wanted": 20
}
```

### Include ratings-only entries

Collect written reviews and star-only ratings for broader product feedback coverage:

```json
{
    "url": "https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product",
    "results_wanted": 100,
    "include_ratings_only": true
}
```

### Limit pagination and use a proxy

Cap the run at five pages and route the requests through an Apify residential proxy:

```json
{
    "url": "https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product",
    "results_wanted": 500,
    "max_pages": 5,
    "proxyConfiguration": {
        "useApifyProxy": true,
        "apifyProxyGroups": ["RESIDENTIAL"]
    }
}
```

## Sample Output

The following is one representative written-review item. Fields that are not published for a particular review are omitted.

```json
{
    "review_id": "401150435",
    "title": "Men's hydration lotion",
    "review_text": "Bought for hubby for his baby smooth skin, works great.",
    "rating": 5,
    "rating_range": 5,
    "user_nickname": "DDebbie",
    "submission_date": "2026-08-23T11:46:28.000+00:00",
    "moderation_status": "APPROVED",
    "is_ratings_only": false,
    "total_feedback_count": 0,
    "total_comment_count": 0,
    "photos": [],
    "videos": [],
    "secondary_ratings": {},
    "badges": {
        "verifiedPurchaser": {
            "ContentType": "REVIEW",
            "Id": "verifiedPurchaser",
            "BadgeType": "Custom"
        }
    },
    "product_id": "prod6177789",
    "product_name": "Maximum Hydration 48-Hour Moisture Body Lotion with Aloe Vera Aloe Vera",
    "is_syndicated": false,
    "is_featured": false,
    "content_locale": "en_US"
}
```

## Tips for Best Results

- Use the full Walgreens product URL, including the `/ID=...-product` portion.
- Start with `results_wanted: 20` to verify the product and output fields before requesting a larger dataset.
- Keep `include_ratings_only` disabled when you need review text and titles. If a product has no written reviews, the Actor automatically falls back to ratings-only entries so the run still returns data.
- Enable `include_ratings_only` when star-only feedback is useful for rating-volume analysis.
- Increase `max_pages` for products with a long review history, while keeping `results_wanted` aligned with the required dataset size.
- Some products have no public reviews or only ratings. A zero-result run can reflect the source data rather than an extraction error.
- Use a proxy configuration for larger or regularly scheduled runs when direct access is unreliable.

## Integrations and Export Formats

- **Google Sheets and Airtable** - Review feedback in familiar tables for analysis and collaboration.
- **Make, Zapier, or n8n** - Trigger workflows after a run completes.
- **Webhooks** - Notify a downstream service when a dataset is ready.
- **Apify API** - Start runs, retrieve datasets, and schedule recurring collection.
- **JSON, CSV, Excel, and XML** - Export data for applications, spreadsheets, reporting, and data exchange.

## Frequently Asked Questions

### Can I collect ratings-only reviews?

Yes. Set `include_ratings_only` to `true` to include records that contain a star rating without a written title or review text. The Actor also falls back to ratings-only entries automatically when a product has no written reviews.

### Which Walgreens product URLs are supported?

Walgreens product URLs containing `/ID=...-product` are supported, including numeric IDs such as `300428282` and alphanumeric IDs such as `prod6177789`.

### Can I collect more than 100 reviews?

Yes. The Actor requests review pages of up to 100 records and continues until it reaches `results_wanted`, `max_pages`, or the available review count.

### Why are some fields missing?

Walgreens does not publish every field for every review. Missing reviewer locations, recommendation signals, media, or metadata are omitted from that item when the source does not provide them.

### Can I scrape multiple products in one run?

No. This input contract accepts one product URL per run. For multiple products, create a task or start separate API runs for each URL.

### Can I schedule recurring review monitoring?

Yes. Apify schedules can run the Actor daily, weekly, or at another interval. Webhooks and the API can send completed datasets to downstream systems.

### Is collecting Walgreens reviews legal?

Public data collection may be subject to Walgreens terms, applicable laws, privacy rules, and restrictions on storing or redistributing review content. You are responsible for using the Actor only where permitted.

## Related Actors

- [Walgreens Product Scraper](https://apify.com/shahidirfan/walgreens-product-scraper) - Collect Walgreens product listings, prices, availability, ratings, and product details.
- [Kroger Reviews Scraper](https://apify.com/shahidirfan/kroger-reviews-scraper) - Collect structured customer reviews from Kroger product pages for comparable retail feedback analysis.

## Support

For issues, feature requests, or custom Actor work, use the Issues tab on the Actor page or contact the developer through Apify.

## Legal Notice

This Actor is designed for legitimate collection of publicly available review data. Users are responsible for complying with Walgreens terms, applicable laws, privacy requirements, and any restrictions on using or redistributing collected content.
