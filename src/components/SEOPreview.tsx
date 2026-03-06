import { Search } from "lucide-react";

interface SEOPreviewProps {
  title: string;
  description: string;
  slug: string;
  keywords?: string[];
  showKeywords?: boolean;
}

export default function SEOPreview({ 
  title, 
  description, 
  slug, 
  keywords = [],
  showKeywords = false 
}: SEOPreviewProps) {
  const displayUrl = `leadpe.online › ${slug}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search size={18} className="text-muted-foreground" />
        <h3 className="font-semibold">Your Google Preview</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        This is how you will appear on Google search.
      </p>

      {/* Google Search Preview Card */}
      <div 
        className="rounded-xl p-4 border"
        style={{ 
          backgroundColor: "#fff", 
          borderColor: "#dfe1e5",
          color: "#202124"
        }}
      >
        {/* URL in green */}
        <div 
          className="text-sm mb-1 truncate"
          style={{ color: "#006621" }}
        >
          {displayUrl}
        </div>

        {/* Title in blue */}
        <h4 
          className="text-xl mb-2 cursor-pointer hover:underline"
          style={{ 
            color: "#1a0dab",
            lineHeight: 1.3
          }}
        >
          {title}
        </h4>

        {/* Description in grey */}
        <p 
          className="text-sm"
          style={{ 
            color: "#4d5156",
            lineHeight: 1.58
          }}
        >
          {description}
        </p>
      </div>

      {/* Indexing note */}
      <p className="text-xs text-muted-foreground">
        It takes 2-4 weeks for Google to show your listing after your site goes live.
      </p>

      {/* Keywords section (optional) */}
      {showKeywords && keywords.length > 0 && (
        <div className="pt-2">
          <p className="text-sm font-medium mb-2">You appear for these searches:</p>
          <div className="flex flex-wrap gap-2">
            {keywords.slice(0, 3).map((keyword, i) => (
              <span 
                key={i}
                className="px-2 py-1 rounded-full text-xs"
                style={{ 
                  backgroundColor: "rgba(0, 230, 118, 0.1)",
                  color: "#00E676"
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pro Tip */}
      {showKeywords && (
        <div 
          className="p-3 rounded-lg border border-border text-sm"
          style={{ backgroundColor: "#101810" }}
        >
          <span className="font-medium">💡 Pro Tip:</span>{" "}
          <span className="text-muted-foreground">
            Ask your happy customers to search for your business on Google and click your site. This improves your ranking!
          </span>
        </div>
      )}
    </div>
  );
}
