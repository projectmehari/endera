-- Drop the restrictive service-role-only policy and replace with public upload
DROP POLICY "Service role can upload tracks" ON storage.objects;

CREATE POLICY "Anyone can upload tracks"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'tracks');