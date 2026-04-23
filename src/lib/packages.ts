export interface WebsitePackage {
  id: string;
  name: string;
  price: number;
  priceLabel?: string;
  deliveryDays: number;
  coderEarning: number;
  leadpeEarning: number;
  features: string[];
  bestFor: string[];
  color: string;
  badge: string;
  recommended?: boolean;
}

export const WEBSITE_PACKAGES: WebsitePackage[] = [
  {
    id: 'basic',
    name: 'Basic Website',
    price: 800,
    deliveryDays: 2,
    coderEarning: 480,
    leadpeEarning: 320,
    features: [
      '5 pages',
      'Mobile friendly',
      'WhatsApp button',
      'Contact form',
      'Google Maps',
      'Basic SEO',
    ],
    bestFor: ['Kirana store', 'Small shop', 'Home business'],
    color: '#666666',
    badge: 'Starter',
  },
  {
    id: 'standard',
    name: 'Standard Website',
    price: 1500,
    deliveryDays: 3,
    coderEarning: 900,
    leadpeEarning: 600,
    features: [
      'Everything in Basic',
      '+ Photo gallery (8–12 photos)',
      '+ Testimonials section',
      '+ AI-written long-form content',
      '+ Full SEO + schema markup',
      '+ Lead capture form',
      '+ Google Business profile section',
    ],
    bestFor: ['Coaching centre', 'Salon', 'Doctor clinic'],
    color: '#00C853',
    badge: 'Popular',
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium Website',
    price: 3000,
    deliveryDays: 5,
    coderEarning: 1800,
    leadpeEarning: 1200,
    features: [
      'Everything in Standard',
      '+ Online booking system (date/time → WhatsApp)',
      '+ WhatsApp chatbot',
      '+ Blog section (3 starter posts)',
      '+ Framer Motion animations',
      '+ Hindi + English toggle',
      '+ Advanced analytics dashboard',
    ],
    bestFor: ['Restaurant', 'Gym / Fitness', 'Event planner'],
    color: '#7C3AED',
    badge: 'Premium',
  },
  {
    id: 'complex',
    name: 'Custom Website',
    price: 5000,
    priceLabel: '₹5,000+',
    deliveryDays: 7,
    coderEarning: 3000,
    leadpeEarning: 2000,
    features: [
      'Everything in Premium',
      '+ E-commerce / Cart & Checkout',
      '+ Payment gateway (Razorpay)',
      '+ Custom admin dashboard',
      '+ Advanced 3rd-party integrations',
      '+ Vibe coder decides exact scope',
    ],
    bestFor: ['Online store', 'Real estate agency', 'Large business'],
    color: '#FF6B00',
    badge: 'Enterprise',
  },
];

export const MONTHLY_MANAGEMENT = {
  price: 299,
  coderPassive: 30,
  features: [
    'Unlimited lead delivery',
    'WhatsApp notifications',
    'Monthly updates',
    'SEO maintenance',
    'Technical support',
  ],
};

export function getPackageById(id: string): WebsitePackage {
  return WEBSITE_PACKAGES.find((p) => p.id === id) || WEBSITE_PACKAGES[0];
}
