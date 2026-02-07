import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import dcsLogo from "@/assets/dcs-logo-clean.png";

export default function CandidateOnboarding() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [completed, setCompleted] = useState(false);

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["onboarding-candidate", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase.from("candidates").select("*").eq("id", candidateId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId,
  });

  const [form, setForm] = useState({
    phone: "", location: "", education: "",
    current_company: "", current_designation: "",
    experience_years: "", current_salary: "", expected_salary: "",
    notice_period: "", skills: "", notes: "",
  });

  // Pre-fill form when candidate loads
  useEffect(() => {
    if (candidate) {
      setForm({
        phone: candidate.phone || "",
        location: candidate.location || "",
        education: candidate.education || "",
        current_company: candidate.current_company || "",
        current_designation: candidate.current_designation || "",
        experience_years: candidate.experience_years?.toString() || "",
        current_salary: candidate.current_salary?.toString() || "",
        expected_salary: candidate.expected_salary?.toString() || "",
        notice_period: candidate.notice_period || "",
        skills: (candidate.skills || []).join(", "),
        notes: candidate.notes || "",
      });
    }
  }, [candidate]);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("candidates").update({
        phone: form.phone || null,
        location: form.location || null,
        education: form.education || null,
        current_company: form.current_company || null,
        current_designation: form.current_designation || null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        current_salary: form.current_salary ? Number(form.current_salary) : null,
        expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
        notice_period: form.notice_period || null,
        skills: form.skills ? form.skills.split(",").map(s => s.trim()) : [],
        notes: form.notes || null,
      }).eq("id", candidateId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding-candidate", candidateId] });
      setCompleted(true);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md"><CardContent className="py-12 text-center text-muted-foreground">Candidate not found or link is invalid.</CardContent></Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="size-16 mx-auto text-green-500" />
            <h2 className="text-xl font-bold">Onboarding Complete!</h2>
            <p className="text-muted-foreground text-sm">Thank you, {candidate.full_name}. Your profile has been updated successfully.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src={dcsLogo} alt="DCS Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground">DCS ATS</h1>
            <p className="text-xs text-muted-foreground">Candidate Onboarding</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {candidate.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">Please complete your profile to help us find the best opportunities for you.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); update.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              </div>
              <div><Label>Education</Label><Input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Current Company</Label><Input value={form.current_company} onChange={e => setForm(f => ({ ...f, current_company: e.target.value }))} /></div>
                <div><Label>Designation</Label><Input value={form.current_designation} onChange={e => setForm(f => ({ ...f, current_designation: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Experience (yrs)</Label><Input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} /></div>
                <div><Label>Current Salary</Label><Input type="number" value={form.current_salary} onChange={e => setForm(f => ({ ...f, current_salary: e.target.value }))} /></div>
                <div><Label>Expected Salary</Label><Input type="number" value={form.expected_salary} onChange={e => setForm(f => ({ ...f, expected_salary: e.target.value }))} /></div>
              </div>
              <div><Label>Notice Period</Label><Input value={form.notice_period} onChange={e => setForm(f => ({ ...f, notice_period: e.target.value }))} placeholder="e.g. 30 days" /></div>
              <div><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} /></div>
              <div><Label>Additional Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
              <Button type="submit" className="w-full" disabled={update.isPending}>{update.isPending ? "Saving..." : "Complete Onboarding"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
