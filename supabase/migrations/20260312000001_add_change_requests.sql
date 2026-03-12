CREATE TABLE IF NOT EXISTS public.change_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    build_request_id uuid REFERENCES public.build_requests(id) ON DELETE CASCADE,
    business_id uuid REFERENCES auth.users(id),
    revision_text text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
