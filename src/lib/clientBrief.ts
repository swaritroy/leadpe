export interface BusinessDetails {
  business_name: string;
  business_type: string;
  city: string;
  owner_name: string;
  owner_whatsapp: string;
  plan_selected: string;
  preferred_language: string;
}

export interface ClientBrief {
  chatgptPrompt: string;
  mandatoryElements: string[];
  businessDetails: {
    name: string;
    type: string;
    city: string;
    ownerName: string;
    whatsapp: string;
  };
  exampleSites: string[];
}

export function generateBrief(business: BusinessDetails): ClientBrief {
  const businessDetails = {
    name: business.business_name,
    type: business.business_type,
    city: business.city,
    ownerName: business.owner_name,
    whatsapp: business.owner_whatsapp
  };

  const chatgptPrompt = `Create a professional website for ${business.business_name}, a ${business.business_type} in ${business.city}, India.
Owner: ${business.owner_name}
WhatsApp: +91${business.owner_whatsapp}

MUST INCLUDE:
1. Hero section with business name and main service
2. Services/offerings section
3. About the business
4. Lead capture form with:
   - Customer name field
   - WhatsApp number field
   - Interest/query field
   - Submit button
5. Floating WhatsApp button linking to +91${business.owner_whatsapp}
6. Location: ${business.city}, India

STYLE:
- Clean and professional
- White and green colors
- Mobile-first design
- Trust-building for Indian local business customers
- Simple Hindi/English mix OK
- No foreign stock photos

TECHNICAL REQUIREMENTS:
- Fast loading (<3 seconds)
- SEO optimized for ${business.city}
- Mobile responsive
- Form validation
- Click-to-call WhatsApp integration
- Local business schema markup
- Google Maps integration optional

CONTENT GUIDELINES:
- Use ${business.owner_name}'s actual business information
- Include specific services offered
- Add trust signals (years in business, testimonials if available)
- Clear call-to-action buttons
- Contact information prominently displayed
- Business hours if applicable

DELIVERABLES:
- Complete HTML/CSS/JavaScript files
- Responsive design
- Working lead capture form
- WhatsApp integration
- Basic SEO setup
- Deployment-ready code`;

  const mandatoryElements = [
    "Lead form with name + phone",
    "WhatsApp floating button",
    "Mobile responsive",
    "Fast loading (<3 seconds)",
    "Business city mentioned prominently",
    "Owner name and contact info",
    "Services/offerings section",
    "Hero section with business name",
    "White and green color scheme",
    "SEO optimized for local search",
    "Click-to-call functionality",
    "Form validation",
    "Professional design",
    "Trust-building elements"
  ];

  const exampleSites = [
    "coaching.leadpe.online (example)",
    "clinic.leadpe.online (example)",
    "salon.leadpe.online (example)",
    "gym.leadpe.online (example)"
  ];

  return {
    chatgptPrompt,
    mandatoryElements,
    businessDetails,
    exampleSites
  };
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getBusinessIcon(businessType: string): string {
  const icons: { [key: string]: string } = {
    "Coaching Centre": "🏫",
    "Doctor / Clinic": "🦷",
    "Lawyer / CA": "⚖️",
    "Salon / Parlour": "💇",
    "Gym / Fitness": "🏋️",
    "Plumber / Electrician": "🔧",
    "Restaurant": "🍽️",
    "Photographer": "📸",
    "Real Estate": "🏠",
    "Dance / Music Class": "🎓",
    "Other": "🏢"
  };
  
  return icons[businessType] || "🏢";
}

export function getBuildingFee(plan: string): number {
  const fees: { [key: string]: number } = {
    "basic": 500,
    "growth": 1500,
    "pro": 2000
  };
  
  return fees[plan] || 1000;
}

export function formatDeadline(deadline: string): string {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours <= 0) {
    return "Overdue";
  } else if (diffHours < 24) {
    return `${diffHours} hours`;
  } else {
    return `${diffDays} days`;
  }
}
