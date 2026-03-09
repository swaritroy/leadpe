
-- Enable realtime for profiles (build_requests and leads already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
