# Walgreens Reviews Scraper

Extract comprehensive product reviews from Walgreens.com with ease. Collect written review titles, full review text, ratings, user information, photo attachments, and detailed review metadata for Walgreens products. Perfect for market research, competitor analysis, and customer feedback monitoring.

## Features

- **Written Review Data** - Extract ratings, review titles, full review text, user nicknames, locations, and submission dates
- **Rich Media Support** - Capture attached photos, videos, pros/cons, secondary ratings, and badges
- **Automatic Pagination** - Automatically loads all reviews for a product, not just the first page
- **Ratings-Only Control** - Collect written reviews by default, or include star-only ratings when needed
- **Rating Statistics** - Get aggregate rating distribution, average scores, and recommendation counts
- **Syndication Detection** - Identify syndicated reviews and their original sources
- **Proxy Support** - Works with Apify Proxy for reliable data collection at scale

## Use Cases

### Product Research

Analyze customer feedback before sourcing products or making purchasing decisions. Understand real user experiences, common complaints, and quality indicators from verified buyers.

### Competitive Intelligence

Monitor how competitor products are rated on Walgreens. Track review sentiment over time, identify emerging issues, and spot market opportunities based on customer feedback patterns.

### Brand Monitoring

Track your own brand's product reviews on Walgreens. Get notified of negative reviews quickly, understand customer sentiment, and gather testimonials for marketing.

### Data Analysis

Build comprehensive datasets for business intelligence and machine learning. Analyze rating distributions, correlate review sentiment with product features, and generate insights from thousands of reviews.

---

## Input Parameters

| Parameter              | Type    | Required | Default                   | Description                                                    |
| ---------------------- | ------- | -------- | ------------------------- | -------------------------------------------------------------- |
| `url`                  | String  | Yes      | -                         | Full Walgreens product page URL                                |
| `results_wanted`       | Integer | No       | `20`                      | Maximum number of reviews to collect                           |
| `include_ratings_only` | Boolean | No       | `false`                   | Include star-only ratings that do not contain review text      |
| `max_pages`            | Integer | No       | `20`                      | Maximum review pages to check, with up to 100 reviews per page |
| `proxyConfiguration`   | Object  | No       | Apify Proxy (RESIDENTIAL) | Proxy settings for reliable scraping                           |

---

## Output Data

Each item in the dataset contains the following fields:

| Field                           | Type    | Description                                          |
| ------------------------------- | ------- | ---------------------------------------------------- |
| `review_id`                     | String  | Unique identifier for the review                     |
| `title`                         | String  | Review title                                         |
| `review_text`                   | String  | Full review content                                  |
| `rating`                        | Number  | Rating out of 5                                      |
| `user_nickname`                 | String  | Reviewer's display name                              |
| `user_location`                 | String  | Reviewer's location                                  |
| `submission_date`               | String  | Date the review was submitted                        |
| `is_recommended`                | Boolean | Whether the reviewer recommends the product          |
| `pros`                          | String  | Pros mentioned in the review                         |
| `cons`                          | String  | Cons mentioned in the review                         |
| `helpfulness`                   | Number  | Helpfulness score                                    |
| `photos`                        | Array   | Photos attached to the review (IDs, captions, URLs)  |
| `videos`                        | Array   | Videos attached to the review                        |
| `secondary_ratings`             | Array   | Additional rating dimensions (value, label, range)   |
| `badges`                        | Object  | Badges awarded to the review                         |
| `context_data_values`           | Object  | Context data about the reviewer                      |
| `is_syndicated`                 | Boolean | Whether the review is syndicated from another source |
| `syndication_source`            | Object  | Source of syndicated review (name, link, logo)       |
| `moderation_status`             | String  | Moderation status of the review                      |
| `total_feedback_count`          | Number  | Total feedback votes                                 |
| `total_positive_feedback_count` | Number  | Positive feedback votes                              |
| `total_negative_feedback_count` | Number  | Negative feedback votes                              |
| `total_comment_count`           | Number  | Number of comments on the review                     |

---

## Usage Examples

### Basic Review Extraction

Extract reviews from a Walgreens product page:

```json
{
    "url": "https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product",
    "results_wanted": 20
}
```

### Include Ratings-Only Entries

Collect written reviews plus star-only ratings:

```json
{
    "url": "https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product",
    "results_wanted": 100,
    "include_ratings_only": true
}
```

### With Residential Proxies

Use residential proxies for better reliability:

```json
{
    "url": "https://www.walgreens.com/store/c/nivea-men-maximum-hydration-nourishing-body-lotion-aloe-vera/ID=prod6177789-product",
    "results_wanted": 100,
    "proxyConfiguration": {
        "useApifyProxy": true,
        "apifyProxyGroups": ["RESIDENTIAL"]
    }
}
```

---

## Sample Output

```json
{
    "review_id": "395833562",
    "title": "Not Bad",
    "review_text": "It's a good product, light scent and absorbs well, however it doesn't last as long as I expected.",
    "rating": 4,
    "rating_range": 5,
    "user_nickname": "GlorBee",
    "user_location": null,
    "submission_date": "2026-06-25T01:39:15.000+00:00",
    "moderation_status": "APPROVED",
    "is_recommended": true,
    "is_ratings_only": false,
    "helpfulness": 0,
    "total_feedback_count": 0,
    "badges": {
        "verifiedPurchaser": {
            "ContentType": "REVIEW",
            "Id": "verifiedPurchaser",
            "BadgeType": "Custom"
        }
    },
    "product_id": "prod6177789",
    "product_name": "Maximum Hydration Nourishing Body Lotion Aloe Vera",
    "content_locale": "en_US"
}
```

---

## Tips for Best Results

### Choose Valid Product URLs

- Use product page URLs (containing `/ID=` and ending with `-product`)
- Verify the product exists and has reviews before scraping
- Product IDs can be numeric or start with `prod`, and both formats are supported
- Start with popular products that have many reviews for testing

### Optimize Collection Size

- Start with `results_wanted: 20` for testing to verify the output format
- Increase to `results_wanted: 200` or more for production runs
- Keep `include_ratings_only` disabled when you only need reviews with title and text

### Proxy Configuration

- For single product runs, Apify Proxy may not be required
- For bulk scraping, residential proxies provide better reliability
- The scraper automatically handles proxy rotation

---

## Integrations

Connect your data with:

- **Google Sheets** - Export for analysis and sharing
- **Airtable** - Build searchable review databases
- **Slack** - Get notifications for new negative reviews
- **Make** - Create automated review monitoring workflows
- **Zapier** - Trigger actions when new reviews are collected

### Export Formats

- **JSON** - For developers and APIs
- **CSV** - For spreadsheet analysis
- **Excel** - For business reporting
- **XML** - For system integrations

---

## Frequently Asked Questions

### How many reviews can I collect?

You can collect all available written reviews for any product. The scraper automatically paginates through review pages until it reaches `results_wanted` or `max_pages`.

### Does this work for any Walgreens product?

Yes, it works with Walgreens product page URLs that contain `/ID=...-product`, including numeric IDs and IDs such as `prod6177789`.

### What if no reviews are found?

Some products have no written reviews yet. If you get 0 results, verify the product URL is correct and try `include_ratings_only: true` to include star-only ratings.

### Can I scrape multiple products?

This actor processes one product URL per run. To scrape multiple products, use Apify's task feature to run multiple instances in parallel, or use the API to trigger runs programmatically.

### Are ratings included?

Yes, each review includes its individual rating (1-5), and the aggregate statistics (average rating, rating distribution, recommendation counts) are captured in the API responses.

---

## Support

For issues or feature requests, contact support through the Apify Console.

### Resources

- [Apify Documentation](https://docs.apify.com/)
- [API Reference](https://docs.apify.com/api/v2)
- [Scheduling Runs](https://docs.apify.com/schedules)

---

## Legal Notice

This actor is designed for legitimate data collection purposes. Users are responsible for ensuring compliance with Walgreens terms of service and applicable laws. Use data responsibly and respect rate limits.
