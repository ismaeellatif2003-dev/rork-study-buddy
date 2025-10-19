-- Migration: Add purchase_platform column to subscriptions table
-- This migration adds the purchase_platform column to track where subscriptions were purchased

-- Add purchase_platform column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS purchase_platform VARCHAR(20) DEFAULT 'web';

-- Update existing subscriptions to have purchase_platform = 'web' (default for existing subscriptions)
UPDATE subscriptions SET purchase_platform = 'web' WHERE purchase_platform IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN subscriptions.purchase_platform IS 'Platform where subscription was purchased: mobile (Apple/Google) or web (Stripe/PayPal)';
