-- Rate limiting trigger: max 1 message per 5 seconds per username
CREATE OR REPLACE FUNCTION public.chat_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.chat_messages
    WHERE username = NEW.username
      AND created_at > now() - interval '5 seconds'
  ) THEN
    RAISE EXCEPTION 'Rate limited: please wait before sending another message';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_rate_limit_trigger
BEFORE INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.chat_rate_limit();