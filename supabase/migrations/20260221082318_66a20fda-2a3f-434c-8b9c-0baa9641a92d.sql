
-- Direct messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  text TEXT,
  code_content TEXT,
  code_language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view DMs they sent or received
CREATE POLICY "Users can view own DMs"
ON public.direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send DMs
CREATE POLICY "Users can send DMs"
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can delete own sent DMs
CREATE POLICY "Users can delete own DMs"
ON public.direct_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
