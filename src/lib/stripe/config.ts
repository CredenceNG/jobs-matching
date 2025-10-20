/**
 * Stripe Configuration
 *
 * Centralized Stripe setup and configuration for JobAI platform.
 * Handles client-side and server-side Stripe initialization.
 *
 * @description Stripe integration configuration and utilities
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

// =============================================================================
// STRIPE CONFIGURATION
// =============================================================================

export const STRIPE_CONFIG = {
  // Stripe Publishable Key (client-side)
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",

  // Premium Plan Configuration
  plans: {
    monthly: {
      priceId:
        process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
        "price_premium_monthly",
      amount: 500, // $5.00 in cents
      currency: "usd",
      interval: "month",
      name: "JobAI Premium Monthly",
      description: "Save job searches and receive personalized job alerts",
    },
    annual: {
      priceId:
        process.env.NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID ||
        "price_premium_annual",
      amount: 4800, // $48.00 in cents ($4/month * 12)
      currency: "usd",
      interval: "year",
      name: "JobAI Premium Annual",
      description:
        "Save job searches and receive personalized job alerts - Save 20%",
    },
  },

  // Feature availability (not usage limits)
  features: {
    free: {
      aiJobMatching: true,
      aiResumeAnalysis: true,
      aiCoverLetterGeneration: true,
      aiInterviewPrep: true,
      careerInsights: true,
      saveJobs: false,
      jobAlerts: false,
      exportResults: false,
    },
    premium: {
      aiJobMatching: true,
      aiResumeAnalysis: true,
      aiCoverLetterGeneration: true,
      aiInterviewPrep: true,
      careerInsights: true,
      saveJobs: true,
      jobAlerts: true,
      exportResults: true,
    },
  },
};

// =============================================================================
// CLIENT-SIDE STRIPE
// =============================================================================

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe instance for client-side operations
 *
 * @returns Promise<Stripe | null>
 * @example
 * const stripe = await getStripe();
 * if (stripe) {
 *   // Use stripe instance
 * }
 */
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
};

// =============================================================================
// SERVER-SIDE STRIPE
// =============================================================================

/**
 * Get Stripe instance for server-side operations
 * This will be imported dynamically in API routes
 */
export const getStripeServer = () => {
  const Stripe = require("stripe");
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  return new Stripe(secretKey, {
    apiVersion: "2024-06-20",
    typescript: true,
  });
};

// =============================================================================
// STRIPE UTILITIES
// =============================================================================

/**
 * Format Stripe amount (cents) to currency string
 *
 * @param amount Amount in cents
 * @param currency Currency code (default: 'usd')
 * @returns Formatted currency string
 * @example
 * formatAmount(2900) // "$29.00"
 */
export const formatAmount = (
  amount: number,
  currency: string = "usd"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

/**
 * Get plan configuration by type
 *
 * @param planType Plan type ('monthly' or 'annual')
 * @returns Plan configuration or null
 */
export const getPlanConfig = (planType: "monthly" | "annual") => {
  return STRIPE_CONFIG.plans[planType] || null;
};

/**
 * Check if user has premium features access
 *
 * @param planType User's current plan
 * @returns Object indicating available features
 */
export const getPlanFeatures = (planType: "free" | "premium") => {
  return STRIPE_CONFIG.features[planType];
};

/**
 * Check if feature is available for plan
 *
 * @param planType User's current plan
 * @param feature Feature to check
 * @returns Boolean indicating if feature is available
 */
export const hasFeatureAccess = (
  planType: "free" | "premium",
  feature: keyof typeof STRIPE_CONFIG.features.free
): boolean => {
  return STRIPE_CONFIG.features[planType][feature];
};

// =============================================================================
// PLAN UTILITIES
// =============================================================================

/**
 * Get all available plans for display
 *
 * @returns Array of plan configurations
 */
export const getAllPlans = () => {
  return [STRIPE_CONFIG.plans.monthly, STRIPE_CONFIG.plans.annual];
};

/**
 * Calculate annual savings
 *
 * @returns Savings amount and percentage
 */
export const getAnnualSavings = () => {
  const monthlyYearly = STRIPE_CONFIG.plans.monthly.amount * 12;
  const annual = STRIPE_CONFIG.plans.annual.amount;
  const savings = monthlyYearly - annual;
  const percentage = Math.round((savings / monthlyYearly) * 100);

  return {
    savings: formatAmount(savings),
    percentage,
  };
};

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

/**
 * Validate Stripe environment configuration
 *
 * @returns Object indicating which keys are missing
 */
export const validateStripeConfig = () => {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    missing.push("STRIPE_SECRET_KEY");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    missing.push("STRIPE_WEBHOOK_SECRET");
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID) {
    missing.push("NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID");
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID) {
    missing.push("NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID");
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
};

// =============================================================================
// STRIPE API FUNCTIONS
// =============================================================================

/**
 * Create a Stripe customer
 *
 * @param email Customer email
 * @param name Customer name
 * @returns Promise<Stripe.Customer>
 */
export async function createStripeCustomer(email: string, name: string) {
  const stripe = getStripeServer();

  return await stripe.customers.create({
    email,
    name,
    metadata: {
      created_by: "jobai_app",
    },
  });
}

/**
 * Create a Stripe subscription
 *
 * @param customerId Stripe customer ID
 * @param priceId Stripe price ID
 * @returns Promise<Stripe.Subscription>
 */
export async function createSubscription(customerId: string, priceId: string) {
  const stripe = getStripeServer();

  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });
}

/**
 * Verify webhook signature
 *
 * @param body Request body
 * @param signature Stripe signature header
 * @returns Stripe.Event
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string
) {
  const stripe = getStripeServer();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

// =============================================================================
// EXPORTS
// =============================================================================

export type PlanType = "free" | "premium";
export type BillingInterval = "monthly" | "annual";
