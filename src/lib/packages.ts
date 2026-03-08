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
    coderEarning: 640,
    leadpeEarning: 160,
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
    coderEarning: 1200,
    leadpeEarning: 300,
    features: [
      'All Basic features',
      'Photo gallery',
      'Testimonials section',
      'AI-written content',
      'Full SEO setup',
      'Lead capture form',
      'Google Business profile',
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
    coderEarning: 2400,
    leadpeEarning: 600,
    features: [
      'All Standard features',
      'Online booking system',
      'WhatsApp chatbot',
      'Blog section',
      'Custom animations',
      'Hindi + English',
      'Advanced analytics',
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
    coderEarning: 4000,
    leadpeEarning: 1000,
    features: [
      'Everything in Premium',
      'E-commerce / Shop',
      'Payment gateway',
      'Custom dashboard',
      'Advanced integrations',
      'Vibe coder decides scope',
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
