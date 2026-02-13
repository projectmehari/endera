-- Explicit deny DELETE and UPDATE policies for chat_messages
-- Admin moderation is handled via admin-delete-chat edge function using service role (bypasses RLS)
CREATE POLICY "No direct delete on chat_messages" ON public.chat_messages FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "No direct update on chat_messages" ON public.chat_messages FOR UPDATE TO anon, authenticated USING (false);