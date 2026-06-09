// frontend/src/lib/plans.ts

export const PLANS = [
  {
    name: "Starter",
    price: 29,
    period: "month",
    description: "Perfect for individual bloggers and small content creators",
    credits: "10,000 AI Credits",
    wordCount: 10000,
    features: [
      "10,000 AI-generated words/month",
      "2 WordPress sites",
      "Basic keyword research",
      "SEO optimization",
      "Content library",
      "Email support",
      "Basic analytics"
    ],
    popular: false,
    color: "blue"
  },
  {
    name: "Professional",
    price: 79,
    period: "month",
    description: "Ideal for growing businesses and content agencies",
    credits: "50,000 AI Credits",
    wordCount: 50000,
    features: [
      "50,000 AI-generated words/month",
      "10 WordPress sites",
      "Advanced keyword research",
      "Priority content generation",
      "Content optimization suggestions",
      "Publishing scheduler",
      "Advanced analytics",
      "Priority support",
      "Custom content templates"
    ],
    popular: true,
    color: "purple"
  },
  {
    name: "Enterprise",
    price: 199,
    period: "month",
    description: "For large teams and high-volume content production",
    credits: "Unlimited AI Credits",
    wordCount: null,
    features: [
      "Unlimited AI-generated words",
      "Unlimited WordPress sites",
      "White-label solution",
      "Custom AI training",
      "API access",
      "Team collaboration tools",
      "Advanced reporting",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee"
    ],
    popular: false,
    color: "gold"
  }
];

export const ADD_ONS = [
  {
    name: "Extra AI Credits",
    price: 10,
    unit: "per 10,000 words",
    description: "Additional AI content generation credits"
  },
  {
    name: "Premium Templates",
    price: 29,
    unit: "one-time",
    description: "Access to 100+ premium content templates"
  },
  {
    name: "Advanced Analytics",
    price: 19,
    unit: "per month",
    description: "Detailed performance metrics and insights"
  }
];
