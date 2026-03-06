export interface BusinessData {
  name: string;
  type: string;
  city: string;
  description: string;
  phone: string;
  price?: string;
  offer?: string;
}

export interface GeneratedSEO {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
  schema: object;
  ogTags: {
    title: string;
    description: string;
    type: string;
    url: string;
  };
}

export function generateSEO(business: BusinessData): GeneratedSEO {
  const { name, type, city, description, phone, price, offer } = business;

  // PAGE TITLE: "Best [type] in [city] — [name]" (max 60 chars)
  let title = `Best ${type} in ${city} — ${name}`;
  if (title.length > 60) {
    // Smart truncate - keep name, shorten type/city
    const maxTypeCity = 60 - name.length - 10; // 10 for "Best in — "
    const shortenedTypeCity = `${type} in ${city}`.slice(0, maxTypeCity).trim();
    title = `Best ${shortenedTypeCity} — ${name}`;
    if (title.length > 60) {
      title = `${name} — ${type} ${city}`.slice(0, 60).trim();
    }
  }

  // META DESCRIPTION: "[name] in [city] — [description]. [offer]. Contact now on WhatsApp." (max 155 chars)
  let descParts: string[] = [`${name} in ${city}`];
  if (description) descParts.push(description);
  if (offer) descParts.push(offer);
  descParts.push("Contact now on WhatsApp");
  
  let description = descParts.join(". ");
  if (description.length > 155) {
    // Smart truncate - keep essential parts
    const essential = `${name} in ${city}. ${description.slice(0, 80)}. Contact now`;
    description = essential.slice(0, 155).trim();
    if (!description.endsWith(".")) description += ".";
  }

  // URL SLUG: lowercase, spaces to hyphens, remove special chars (max 30 chars)
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to hyphens
    .slice(0, 30)
    .replace(/-+$/, ""); // remove trailing hyphens

  // KEYWORDS array
  const keywords = [
    `${type} in ${city}`,
    `${type} near me`,
    `best ${type} ${city}`,
    `${name}`,
    `${name} ${city}`,
    `affordable ${type} ${city}`,
    `${city} ${type} contact`,
    `${type} ${city} fees`,
  ];

  // LOCAL BUSINESS SCHEMA (JSON-LD)
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: name,
    description: description,
    telephone: phone,
    priceRange: price || "₹₹",
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressCountry: "IN",
    },
    url: `https://${slug}.leadpe.online`,
    areaServed: {
      "@type": "City",
      name: city,
    },
    serviceType: type,
  };

  // OPEN GRAPH TAGS
  const ogTags = {
    title: title,
    description: description,
    type: "business.business",
    url: `https://${slug}.leadpe.online`,
  };

  return {
    title,
    description,
    slug,
    keywords,
    schema,
    ogTags,
  };
}

// Helper to truncate text intelligently
export function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Find last complete word before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace);
  }
  
  return truncated;
}

// Generate Google Business Profile link
export function generateGoogleBusinessLink(businessName: string, city: string): string {
  const query = encodeURIComponent(`${businessName} ${city}`);
  return `https://business.google.com/near-me?query=${query}`;
}

// Generate search preview for a keyword
export function generateSearchPreview(business: BusinessData, keyword: string): {
  title: string;
  description: string;
  url: string;
} {
  const seo = generateSEO(business);
  
  return {
    title: `${keyword} — ${business.name}`,
    description: seo.description,
    url: `https://${seo.slug}.leadpe.online`,
  };
}
