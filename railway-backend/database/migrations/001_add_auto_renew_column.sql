-- Migration: Add auto_renew column to subscriptions table
-- This migration adds the auto_renew column to track subscription renewal status

-- Add auto_renew column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Update existing subscriptions to have auto_renew = true (default behavior)
UPDATE subscriptions SET auto_renew = true WHERE auto_renew IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether the subscription should auto-renew. Set to false when user cancels but subscription remains active until expiry.';
