
-- Atomic accept function to prevent race conditions
CREATE OR REPLACE FUNCTION public.accept_build_request(
  _request_id uuid,
  _coder_id uuid,
  _coder_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows int;
BEGIN
  UPDATE build_requests
  SET assigned_coder_id = _coder_id,
      assigned_coder_name = _coder_name,
      status = 'building'
  WHERE id = _request_id
    AND assigned_coder_id IS NULL
    AND status = 'pending';

  GET DIAGNOSTICS _rows = ROW_COUNT;
  RETURN _rows = 1;
END;
$$;

-- Auto-expire old pending requests
CREATE OR REPLACE FUNCTION public.expire_stale_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE build_requests
  SET status = 'expired'
  WHERE status = 'pending'
    AND hard_deadline IS NOT NULL
    AND hard_deadline < now();
END;
$$;
