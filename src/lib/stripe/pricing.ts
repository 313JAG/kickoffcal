/** Billing interval for Pro Checkout. */
export type ProPlanInterval = "monthly" | "yearly";

/**
 * FINAL KickoffCal Pro pricing (USD only) — FINAL_USD_2_AND_15_1788972819:
 * - $2/mo with 14-day free trial
 * - $15/yr (save $9 vs 12×$2) with 14-day free trial
 */
export const PRO_PLANS = {
  monthly: {
    interval: "monthly" as const,
    amountUsd: 2,
    priceDisplay: "$2/mo",
    shortLabel: "Monthly",
    cadenceLabel: "/mo",
    blurb: "14 days free, then $2/mo",
    savingsLabel: null as string | null,
    trialDays: 14,
    applyTrial: true,
  },
  yearly: {
    interval: "yearly" as const,
    amountUsd: 15,
    priceDisplay: "$15/yr",
    shortLabel: "Yearly",
    cadenceLabel: "/yr",
    blurb: "$15/yr · save $9 vs monthly",
    savingsLabel: "Save $9 vs monthly",
    trialDays: 14,
    applyTrial: true,
  },
} as const;

export const PRO_PRICE_DISPLAY = PRO_PLANS.monthly.priceDisplay;
export const PRO_TRIAL_DAYS = PRO_PLANS.monthly.trialDays;
export const PRO_TRIAL_BLURB = PRO_PLANS.monthly.blurb;
export const PRO_UPGRADE_BLURB = "Pro from $2/mo or $15/yr";

export function isProPlanInterval(value: unknown): value is ProPlanInterval {
  return value === "monthly" || value === "yearly";
}

export function getProPlan(interval: ProPlanInterval = "monthly") {
  return PRO_PLANS[interval];
}
