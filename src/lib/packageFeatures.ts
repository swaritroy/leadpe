// Category-specific features for each package tier
export type PackageTier = "starter" | "standard" | "premium";

export interface CategoryFeatures {
  starter: string[];
  standard: string[];
  premium: string[];
}

export const PACKAGE_FEATURES: Record<string, CategoryFeatures> = {
  "Doctor / Clinic": {
    starter: [
      "5-page professional website",
      "Online appointment booking form",
      "Doctor profile + qualifications",
      "Clinic timings display",
      "WhatsApp consultation button",
      "Google Maps location",
      "Basic SEO for your city",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Patient testimonials section",
      "Services + fees list",
      "Before/after gallery",
      "Insurance accepted display",
      "Multiple doctor profiles",
      "Blog for health tips",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Online appointment system",
      "Patient inquiry tracking",
      "Video consultation page",
      "Health articles blog",
      "Emergency contact banner",
      "WhatsApp chatbot",
      "Google My Business setup",
    ],
  },
  "Coaching Institute": {
    starter: [
      "5-page coaching website",
      "Courses + batch details",
      "Faculty introduction",
      "Admission enquiry form",
      "Fee structure display",
      "WhatsApp enquiry button",
      "Google Maps location",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Student results/ranks showcase",
      "Subject-wise course pages",
      "Photo gallery of centre",
      "Testimonials from students",
      "Study materials download",
      "Online demo class booking",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Online admission form",
      "Fee payment information",
      "Live batch schedule",
      "Faculty detail pages",
      "Success stories videos",
      "Parent testimonials",
      "Google My Business setup",
    ],
  },
  "CA / Lawyer / CS": {
    starter: [
      "5-page professional website",
      "Services offered list",
      "Professional profile/bio",
      "Consultation booking form",
      "Office timings",
      "WhatsApp consultation button",
      "Google Maps location",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Practice areas detail pages",
      "Client testimonials",
      "Case studies section",
      "Team profiles",
      "FAQ section",
      "Document checklist downloads",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Online consultation booking",
      "Secure contact forms",
      "Newsletter signup",
      "Blog for legal/tax tips",
      "Awards + recognition section",
      "Multiple office locations",
      "Google My Business setup",
    ],
  },
  "Restaurant / Cafe": {
    starter: [
      "5-page restaurant website",
      "Menu with photos",
      "Location + timings",
      "WhatsApp order button",
      "Google Maps embed",
      "Special dishes highlight",
      "Contact form",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Full digital menu by category",
      "Photo gallery of dishes",
      "Customer reviews section",
      "Table reservation form",
      "Catering enquiry form",
      "Chef special section",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Online ordering system",
      "Home delivery info",
      "Loyalty program page",
      "Events booking",
      "Corporate order enquiry",
      "Festival special menus",
      "Google My Business setup",
    ],
  },
  "Salon / Parlour": {
    starter: [
      "5-page salon website",
      "Services + price list",
      "Salon photos gallery",
      "Appointment booking form",
      "WhatsApp booking button",
      "Google Maps location",
      "Timings display",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Before/after transformations",
      "Team profiles",
      "Products used display",
      "Client testimonials",
      "Special offers section",
      "Bridal/wedding packages",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Online appointment system",
      "Membership packages",
      "Gift voucher information",
      "Video testimonials",
      "Loyalty rewards page",
      "Instagram feed integration",
      "Google My Business setup",
    ],
  },
  "Gym / Fitness Trainer": {
    starter: [
      "5-page fitness website",
      "Programs + class details",
      "Trainer profile",
      "Membership enquiry form",
      "WhatsApp enquiry button",
      "Google Maps location",
      "Timings display",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Body transformation gallery",
      "Class schedule table",
      "Membership plans + pricing",
      "Client testimonials",
      "Trainer certifications",
      "Free trial class CTA",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Online membership signup",
      "Diet plan pages",
      "Video workout previews",
      "Personal training booking",
      "Success stories section",
      "WhatsApp chatbot",
      "Google My Business setup",
    ],
  },
  "Contractor / Plumber": {
    starter: [
      "5-page business website",
      "Services offered list",
      "Past projects photos",
      "Free quote request form",
      "WhatsApp enquiry button",
      "Google Maps location",
      "Contact details",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Project portfolio gallery",
      "Client testimonials",
      "Materials used display",
      "Team + experience section",
      "Service area coverage",
      "Certifications display",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Detailed project pages",
      "Cost estimator guide",
      "Video walkthrough embed",
      "Subcontractor information",
      "Award + recognition",
      "Blog for tips",
      "Google My Business setup",
    ],
  },
  "Photographer / Videographer": {
    starter: [
      "5-page portfolio website",
      "Photo/video showcase",
      "Services + packages",
      "Booking enquiry form",
      "WhatsApp booking button",
      "Google Maps location",
      "About the photographer",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Full portfolio gallery with tabs",
      "Package pricing display",
      "Client testimonials",
      "Equipment & style section",
      "Event coverage details",
      "Blog section",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Online booking system",
      "Video gallery embed",
      "Client login gallery",
      "Detailed case studies",
      "Awards display",
      "WhatsApp chatbot",
      "Google My Business setup",
    ],
  },
  "Digital Agency": {
    starter: [
      "5-page agency website",
      "Services offered",
      "Portfolio showcase",
      "Contact + enquiry form",
      "WhatsApp enquiry button",
      "Google Maps location",
      "Team introduction",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Case studies section",
      "Client testimonials",
      "Pricing packages display",
      "Process explanation",
      "Tool stack display",
      "Blog section",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Client portal info",
      "Detailed case studies",
      "Video testimonials",
      "Awards display",
      "Live chat widget",
      "Lead magnet download",
      "Google My Business setup",
    ],
  },
  "Architect": {
    starter: [
      "5-page architecture website",
      "Project portfolio gallery",
      "Services list",
      "Consultation booking form",
      "WhatsApp enquiry button",
      "Google Maps location",
      "About the architect",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Detailed project pages",
      "Client testimonials",
      "Design process section",
      "Team profiles",
      "Awards & recognition",
      "Blog section",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "3D rendering gallery",
      "Video walkthroughs",
      "Online consultation booking",
      "Floor plan downloads",
      "Sustainability section",
      "WhatsApp chatbot",
      "Google My Business setup",
    ],
  },
  "Individual Consultant": {
    starter: [
      "5-page consultant website",
      "Services offered list",
      "Professional profile/bio",
      "Consultation booking form",
      "WhatsApp enquiry button",
      "Google Maps or area served",
      "Testimonials section",
      "Mobile optimized",
    ],
    standard: [
      "Everything in Starter",
      "Case studies section",
      "Client testimonials",
      "Expertise areas pages",
      "FAQ section",
      "Free resources section",
      "Newsletter signup",
      "Full local SEO",
    ],
    premium: [
      "Everything in Standard",
      "Online booking system",
      "Blog for insights",
      "Video introduction",
      "Course/workshop pages",
      "Media & speaking section",
      "WhatsApp chatbot",
      "Google My Business setup",
    ],
  },
};

// Default features for unlisted business types
const DEFAULT_FEATURES: CategoryFeatures = {
  starter: [
    "5-page professional website",
    "Services/products catalog",
    "About your business",
    "Contact + enquiry form",
    "WhatsApp enquiry button",
    "Google Maps location",
    "Basic SEO for your city",
    "Mobile optimized",
  ],
  standard: [
    "Everything in Starter",
    "Photo gallery section",
    "Customer testimonials",
    "Detailed service pages",
    "FAQ section",
    "Team profiles",
    "Lead capture form",
    "Full local SEO",
  ],
  premium: [
    "Everything in Standard",
    "Online booking system",
    "Blog section",
    "Video testimonials",
    "WhatsApp chatbot",
    "Custom animations",
    "Newsletter signup",
    "Google My Business setup",
  ],
};

export function getFeaturesForCategory(businessType: string): CategoryFeatures {
  if (!businessType) return DEFAULT_FEATURES;
  // Try exact match first
  if (PACKAGE_FEATURES[businessType]) return PACKAGE_FEATURES[businessType];
  // Try partial match
  const lower = businessType.toLowerCase();
  for (const [key, val] of Object.entries(PACKAGE_FEATURES)) {
    if (lower.includes(key.toLowerCase().split("/")[0].trim()) || key.toLowerCase().includes(lower.split("/")[0].trim())) {
      return val;
    }
  }
  return DEFAULT_FEATURES;
}

export function getPackageTierFromId(packageId: string): PackageTier {
  if (packageId === "basic") return "starter";
  if (packageId === "standard") return "standard";
  if (packageId === "premium" || packageId === "complex") return "premium";
  return "starter";
}
