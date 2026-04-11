UPDATE public.build_requests
SET hard_deadline = created_at + interval '48 hours',
    deadline = created_at + interval '48 hours'
WHERE hard_deadline IS NULL AND status = 'pending';