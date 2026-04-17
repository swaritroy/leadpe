
-- Wipe all non-admin test data
DO $$
DECLARE
  admin_ids uuid[];
BEGIN
  SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role = 'admin';

  -- Truncate test-only tables
  TRUNCATE TABLE public.signups, public.otp_verifications, public.scheduled_messages,
                 public.message_log, public.order_timeline, public.quality_reports RESTART IDENTITY;

  -- Delete dependent rows for non-admin business owners / coders
  DELETE FROM public.leads WHERE business_id IN (SELECT id FROM public.businesses WHERE owner_id <> ALL(admin_ids));
  DELETE FROM public.change_requests WHERE business_id <> ALL(admin_ids);
  DELETE FROM public.ratings;
  DELETE FROM public.feedback WHERE user_id <> ALL(admin_ids) OR user_id IS NULL;
  DELETE FROM public.coder_penalties;
  DELETE FROM public.earnings WHERE vibe_coder_id <> ALL(admin_ids) OR vibe_coder_id IS NULL;
  DELETE FROM public.deployments WHERE vibe_coder_id <> ALL(admin_ids) OR vibe_coder_id IS NULL;
  DELETE FROM public.build_requests;
  DELETE FROM public.orders;
  DELETE FROM public.payments;
  DELETE FROM public.subscriptions WHERE user_id <> ALL(admin_ids);
  DELETE FROM public.projects WHERE dev_id <> ALL(admin_ids);
  DELETE FROM public.business_seo;
  DELETE FROM public.businesses WHERE owner_id <> ALL(admin_ids);

  -- Delete profiles & roles for non-admin users
  DELETE FROM public.user_roles WHERE user_id <> ALL(admin_ids);
  DELETE FROM public.profiles WHERE user_id <> ALL(admin_ids);

  -- Finally delete non-admin auth users (cascades sessions/identities)
  DELETE FROM auth.users WHERE id <> ALL(admin_ids);
END $$;
