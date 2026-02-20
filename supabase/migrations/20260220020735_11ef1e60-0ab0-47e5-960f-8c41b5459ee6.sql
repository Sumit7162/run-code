
-- Add a foreign key from messages.user_id to profiles.user_id so we can join
ALTER TABLE public.messages 
ADD CONSTRAINT messages_profile_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
