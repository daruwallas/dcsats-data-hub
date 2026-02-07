import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";
import dcsLogo from "@/assets/dcs-logo-clean.png";

export default function SubmitCV() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", location: "",
    current_company: "", current_designation: "",
    experience_years: "", skills: "", education: "", notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name) {
      toast({ title: "Error", description: "Full name is required", variant: "destructive" });
      return;
    }
    setSaving(true);

    let resume_url: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `public/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
      resume_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("candidates").insert({
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      location: form.location || null,
      current_company: form.current_company || null,
      current_designation: form.current_designation || null,
      experience_years: form.experience_years ? Number(form.experience_years) : null,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()) : [],
      education: form.education || null,
      notes: form.notes || null,
      resume_url,
      source: "portal",
      status: "new" as const,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="size-16 mx-auto text-green-500" />
            <h2 className="text-xl font-bold">CV Submitted Successfully!</h2>
            <p className="text-muted-foreground text-sm">
              Thank you for your interest. Our team will review your profile and reach out if there&apos;s a match.
            </p>
            <Button variant="outline" onClick={() => navigate("/portal")}>
              <ArrowLeft className="size-4 mr-2" /> Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src={dcsLogo} alt="DCS Logo" className="h-10 w-10 object-contain cursor-pointer" onClick={() => navigate("/portal")} />
          <div>
            <h1 className="text-lg font-bold text-foreground">DCS ATS</h1>
            <p className="text-xs text-muted-foreground">Submit Your CV</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/portal")} className="mb-4">
          <ArrowLeft className="size-4 mr-1" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Submit Your CV</CardTitle>
            <p className="text-sm text-muted-foreground">Fill in your details and upload your resume</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City" /></div>
                <div><Label>Education</Label><Input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} placeholder="B.Tech, MBA, etc." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Current Company</Label><Input value={form.current_company} onChange={e => setForm(f => ({ ...f, current_company: e.target.value }))} /></div>
                <div><Label>Current Designation</Label><Input value={form.current_designation} onChange={e => setForm(f => ({ ...f, current_designation: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Experience (years)</Label>
                <Input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} placeholder="e.g. 5" />
              </div>
              <div>
                <Label>Skills (comma-separated)</Label>
                <Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, Node.js, Python" />
              </div>
              <div>
                <Label>Upload Resume</Label>
                <div className="mt-1">
                  <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="size-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{file ? file.name : "Choose file (PDF, DOC, DOCX)"}</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Anything else you'd like us to know..." />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Submitting..." : "Submit CV"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
