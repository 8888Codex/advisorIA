-- Create a more robust function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- For email/password sign-ups, use the provided first and last name fields.
  first_name_val := new.raw_user_meta_data ->> 'first_name';
  last_name_val := new.raw_user_meta_data ->> 'last_name';

  -- For provider sign-ups (e.g., Google), extract the name from the 'full_name' field.
  IF first_name_val IS NULL AND (new.raw_user_meta_data ->> 'full_name') IS NOT NULL THEN
    first_name_val := split_part(new.raw_user_meta_data ->> 'full_name', ' ', 1);
    last_name_val := substring(new.raw_user_meta_data ->> 'full_name' from position(' ' in new.raw_user_meta_data ->> 'full_name') + 1);
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    first_name_val,
    last_name_val,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

-- Ensure the trigger is correctly configured to fire the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();