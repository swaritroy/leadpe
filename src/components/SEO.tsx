import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  schema?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const SITE_URL = "https://leadpe.online";
const DEFAULT_IMAGE = "https://leadpe.online/og-default.jpg";

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LeadPe",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: ["https://leadpe.lovable.app"],
  description: "AI-powered website distribution for Indian local businesses. Live in 48 hours.",
};

const SOFTWARE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LeadPe",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Launch a professional AI-built business website in 48 hours. Pay only for results.",
  offers: { "@type": "Offer", price: "800", priceCurrency: "INR" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "120" },
};

const SEO = ({
  title = "LeadPe | AI-Powered Website Distribution for Local Businesses",
  description = "India's AI-Powered Digital Distribution. Live in 48 Hours. Pay Only for Results.",
  path = "",
  image = DEFAULT_IMAGE,
  type = "website",
  schema,
  noindex = false,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
  const fullDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;
  const schemas = [ORG_SCHEMA, SOFTWARE_SCHEMA, ...(schema ? (Array.isArray(schema) ? schema : [schema]) : [])];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="LeadPe" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
