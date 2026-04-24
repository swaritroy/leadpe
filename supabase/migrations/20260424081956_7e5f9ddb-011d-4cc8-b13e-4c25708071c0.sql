-- Reset password for user 9973383902 (Swarit Roy) to '12345678' as requested by admin
UPDATE auth.users
SET encrypted_password = crypt('12345678', gen_salt('bf')),
    updated_at = now()
WHERE id = '253ee9b1-ca74-4d11-93af-683ff31dbdb0';

-- Mark the related reset request as completed
UPDATE public.password_reset_requests
SET status = 'completed',
    completed_at = now(),
    admin_note = 'Password reset by admin to 12345678'
WHERE user_id = '253ee9b1-ca74-4d11-93af-683ff31dbdb0'
  AND status = 'pending';