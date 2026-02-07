
-- Create storage bucket for CVs/resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload resumes (public CV submit)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to read resumes
CREATE POLICY "Anyone can read resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes');

-- Allow authenticated users to delete resumes
CREATE POLICY "Authenticated users can delete resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);
