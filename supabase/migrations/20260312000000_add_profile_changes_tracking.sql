-- Add rate limit tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name_changes_this_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS number_changes_this_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS changes_reset_date date DEFAULT CURRENT_DATE;

-- Add pg_cron job to reset the counters on the 1st of every month
-- Requires pg_cron extension
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'reset_profile_changes_limit',
      '0 0 1 * *', -- Run at midnight on the 1st of every month
      $cron_job$
        UPDATE public.profiles
        SET name_changes_this_month = 0,
            number_changes_this_month = 0,
            changes_reset_date = CURRENT_DATE;
      $cron_job$
    );
  END IF;
END $$;
