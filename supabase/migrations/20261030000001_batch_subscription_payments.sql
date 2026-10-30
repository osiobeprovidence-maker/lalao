BEGIN;

-- Add the Batch hosted-checkout reference and idempotent renewal reminder state
-- used by the Convex subscription payment flow.
ALTER TABLE public."subscriptionReservations"
  ADD COLUMN IF NOT EXISTS "bachsReference" text,
  ADD COLUMN IF NOT EXISTS "bachsCheckoutId" text;

CREATE INDEX IF NOT EXISTS "idx_subscriptionReservations_by_bachs_reference"
  ON public."subscriptionReservations" ("bachsReference");

ALTER TABLE public."subscriptionMemberships"
  ADD COLUMN IF NOT EXISTS "renewalReminderForPeriodEnd" double precision;

ALTER TABLE public."creatorSubscriptions"
  ADD COLUMN IF NOT EXISTS "renewalReminderSentFor" double precision;

ALTER TABLE public."adPayments"
  ADD COLUMN IF NOT EXISTS "providerTransactionId" text;

COMMENT ON COLUMN public."subscriptionReservations"."bachsReference" IS 'Convex validator: optional(string)';
COMMENT ON COLUMN public."subscriptionReservations"."bachsCheckoutId" IS 'Convex validator: optional(string)';
COMMENT ON INDEX public."idx_subscriptionReservations_by_bachs_reference" IS 'Convex non-unique index by_bachs_reference on subscriptionReservations(bachsReference)';
COMMENT ON COLUMN public."subscriptionMemberships"."renewalReminderForPeriodEnd" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."creatorSubscriptions"."renewalReminderSentFor" IS 'Convex validator: optional(float64)';
COMMENT ON COLUMN public."adPayments"."providerTransactionId" IS 'Convex validator: optional(string)';

COMMIT;
