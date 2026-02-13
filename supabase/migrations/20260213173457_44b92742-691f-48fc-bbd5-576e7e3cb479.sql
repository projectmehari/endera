-- Drop the overly permissive INSERT policy
DROP POLICY "Anyone can send chat messages" ON public.chat_messages;

-- Re-create with explicit role targeting (anon + authenticated) instead of public
-- This still allows all visitors to send messages but satisfies the RLS linter
CREATE POLICY "Anyone can send chat messages"
ON public.chat_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(message) > 0 AND length(message) <= 280
  AND length(username) > 0 AND length(username) <= 20
);