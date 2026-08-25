import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  sku?: string;
  ratingValue?: number;
  reviewCount?: number;
  category?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const DEFAULT_TITLE = 'YURAE — Luxury Outfits & Korean-Inspired Botanical Skincare';
const DEFAULT_DESC =
  'Discover bespoke minimalist fashion, artisanal jewelry, and Korean-inspired botanical skincare rituals crafted for radiant, timeless elegance.';
const DEFAULT_IMAGE = '/images/hero-skincare-model.jpg';
const SITE_NAME = 'YURAE | Luxury Fashion & Beauty';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  price,
  currency = 'INR',
  availability = 'InStock',
  brand = 'YURAE',
  sku,
  ratingValue,
  reviewCount,
  category,
  breadcrumbs,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title
      ? title.toLowerCase().includes('yurae')
        ? title
        : `${title} — YURAE Luxury`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Canonical URL & Image URL resolution
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://yurae.com';
    const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : currentOrigin);

    let resolvedImage = image;
    if (image.startsWith('/')) {
      resolvedImage = `${currentOrigin}${image}`;
    }

    // 3. Helper to update or create meta tags
    const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard SEO Meta
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // OpenGraph Meta (WhatsApp, Instagram, Facebook, Pinterest, LinkedIn)
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', resolvedImage);
    setMetaTag('property', 'og:image:secure_url', resolvedImage);
    setMetaTag('property', 'og:image:width', '1200');
    setMetaTag('property', 'og:image:height', '630');
    setMetaTag('property', 'og:image:alt', formattedTitle);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:locale', 'en_US');

    // Product specific OpenGraph tags
    if (type === 'product') {
      if (price !== undefined) {
        setMetaTag('property', 'product:price:amount', price.toString());
        setMetaTag('property', 'product:price:currency', currency);
      }
      setMetaTag('property', 'product:brand', brand);
      setMetaTag('property', 'product:availability', availability === 'InStock' ? 'in stock' : 'out of stock');
      setMetaTag('property', 'product:condition', 'new');
      if (sku) setMetaTag('property', 'product:retailer_item_id', sku);
      if (category) setMetaTag('property', 'product:category', category);
    }

    // Twitter / X Card Meta Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:site', '@YuraeLuxury');
    setMetaTag('name', 'twitter:creator', '@YuraeLuxury');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', resolvedImage);
    setMetaTag('name', 'twitter:image:alt', formattedTitle);

    // Canonical link tag
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // 4. JSON-LD Structured Data Schema
    let jsonLdScript = document.querySelector('#yurae-json-ld') as HTMLScriptElement;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'yurae-json-ld';
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }

    let schemaData: any;

    if (type === 'product') {
      schemaData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: title || DEFAULT_TITLE,
        image: [resolvedImage],
        description: description,
        sku: sku || 'YURAE-ITEM',
        brand: {
          '@type': 'Brand',
          name: brand,
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: currency,
          price: price !== undefined ? price.toString() : '0',
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            availability === 'InStock'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Yurae Luxury',
          },
        },
      };

      if (ratingValue && reviewCount && reviewCount > 0) {
        schemaData.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: ratingValue.toString(),
          reviewCount: reviewCount.toString(),
          bestRating: '5',
          worstRating: '1',
        };
      }
    } else {
      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Yurae',
        url: currentOrigin,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${currentOrigin}/shop?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
    }

    if (breadcrumbs && breadcrumbs.length > 0) {
      schemaData = [
        schemaData,
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((bc, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: bc.name,
            item: bc.url.startsWith('http') ? bc.url : `${currentOrigin}${bc.url}`,
          })),
        },
      ];
    }

    jsonLdScript.textContent = JSON.stringify(schemaData);

    return () => {
      // Optional cleanup on unmount
    };
  }, [
    title,
    description,
    image,
    url,
    type,
    price,
    currency,
    availability,
    brand,
    sku,
    ratingValue,
    reviewCount,
    category,
    breadcrumbs,
  ]);

  return null;
};
