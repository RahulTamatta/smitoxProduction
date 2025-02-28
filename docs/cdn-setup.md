# CDN Integration Guide

This document explains how to set up and configure Content Delivery Network (CDN) integration for your application.

## Overview

Our application uses CDN services to deliver static assets (images, CSS, JavaScript) faster to end users by serving these files from servers closer to them geographically.

## Supported CDN Providers

- AWS CloudFront
- Cloudflare
- Azure CDN
- Akamai

## Setup Instructions

### AWS CloudFront Setup

1. **Create a CloudFront Distribution**:
   - Go to AWS Console > CloudFront
   - Create a new distribution
   - Set Origin Domain Name to your application's domain
   - Configure cache behaviors for `/assets/*` paths

2. **Configure DNS**:
   - Create a CNAME record pointing `cdn.yourwebsite.com` to your CloudFront distribution domain

3. **Update Environment Variables**:
   ```
   CDN_BASE_URL=https://cdn.yourwebsite.com
   ```

### Cloudflare Setup

1. **Add Your Website to Cloudflare**:
   - Create a Cloudflare account
   - Add your website and update nameservers as instructed

2. **Enable Cloudflare CDN**:
   - Go to the "Speed" tab
   - Enable "Auto Minify" for HTML, CSS, and JavaScript
   - Enable "Brotli" compression

3. **Create Page Rules**:
   - Set Cache Level: Cache Everything for `/assets/*`
   - Edge Cache TTL: a month

4. **Update Environment Variables**:
   ```
   CDN_BASE_URL=https://yourwebsite.com
   ```

## Usage in Application

The CDN configuration is automatically applied when running in production mode. The middleware handles:

1. Setting appropriate cache headers
2. Rewriting asset URLs to use the CDN base URL

### Example Usage in Templates

Instead of directly using asset URLs, use the `assetUrl` helper:

```javascript
// Before
<img src="/assets/images/logo.png">

// After
<img src="<%= assetUrl('/assets/images/logo.png') %>">
```

## Cache Invalidation

When deploying new assets, you may need to invalidate the CDN cache:

### AWS CloudFront

```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/assets/*"
```

### Cloudflare

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
```

## Monitoring

Monitor your CDN performance:

- AWS CloudFront: CloudWatch metrics
- Cloudflare: Analytics dashboard

## Troubleshooting

1. **Assets Not Being Served via CDN**
   - Check environment variables are set correctly
   - Verify DNS configuration
   - Check CDN configuration in the application

2. **Caching Issues**
   - Verify cache headers are correctly set
   - Check CDN cache settings
   - Try invalidating the cache
