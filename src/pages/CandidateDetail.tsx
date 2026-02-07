import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, GraduationCap, IndianRupee, Clock, Pencil, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statuses = ["new", "screening", "shortlisted", "interview", "offered", "hired", "rejected", "on_hold"] as const;

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("candidates").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("candidates").update({ status: status as any }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["candidate", id] }); toast({ title: "Status updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleCVUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `candidates/${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
    await supabase.from("candidates").update({ resume_url: urlData.publicUrl }).eq("id", id!);
    qc.invalidateQueries({ queryKey: ["candidate", id] });
    toast({ title: "Resume uploaded!" });
    setUploading(false);
  };

  // Matches for this candidate
  const { data: matches = [] } = useQuery({
    queryKey: ["candidate-matches", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, overall_score, status, jobs(title)")
        .eq("candidate_id", id!)
        .order("overall_score", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!candidate) return <div className="text-center py-12 text-muted-foreground">Candidate not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/candidates")}><ArrowLeft className="size-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{candidate.full_name}</h1>
          {candidate.current_designation && <p className="text-muted-foreground">{candidate.current_designation} {candidate.current_company ? `at ${candidate.current_company}` : ""}</p>}
        </div>
        <EditCandidateDialog candidate={candidate} open={editOpen} onOpenChange={setEditOpen} onSaved={() => { qc.invalidateQueries({ queryKey: ["candidate", id] }); setEditOpen(false); }} />
        <Select value={candidate.status} onValueChange={(v) => updateStatus.mutate(v)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Resume section */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center justify-between">
          Resume
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild disabled={uploading}>
              <span><Upload className="size-4 mr-2" />{uploading ? "Uploading..." : "Upload CV"}</span>
            </Button>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => { if (e.target.files?.[0]) handleCVUpload(e.target.files[0]); }} />
          </label>
        </CardTitle></CardHeader>
        <CardContent>
          {candidate.resume_url ? (
            <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm">
              <FileText className="size-4" /> View Resume →
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No resume uploaded yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {candidate.email && <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{candidate.email}</div>}
            {candidate.phone && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{candidate.phone}</div>}
            {candidate.location && <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{candidate.location}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Professional</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {candidate.current_company && <div className="flex items-center gap-2"><Briefcase className="size-4 text-muted-foreground" />{candidate.current_company}</div>}
            {candidate.education && <div className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" />{candidate.education}</div>}
            {candidate.experience_years !== null && <div>Experience: {candidate.experience_years} years</div>}
            {candidate.notice_period && <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" />Notice: {candidate.notice_period}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Compensation</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Current Salary</span><span className="flex items-center gap-1"><IndianRupee className="size-3" />{candidate.current_salary ? `${(candidate.current_salary/100000).toFixed(1)}L` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expected Salary</span><span className="flex items-center gap-1"><IndianRupee className="size-3" />{candidate.expected_salary ? `${(candidate.expected_salary/100000).toFixed(1)}L` : "—"}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
          <CardContent>
            {candidate.skills && candidate.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">{candidate.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>
            ) : <p className="text-sm text-muted-foreground">No skills listed</p>}
          </CardContent>
        </Card>
      </div>

      {/* Matches */}
      <Card>
        <CardHeader><CardTitle className="text-base">Matched Jobs ({matches.length})</CardTitle></CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet</p>
          ) : (
            <div className="space-y-2">
              {matches.map(m => {
                const j = m.jobs as any;
                return (
                  <div key={m.id} className="flex items-center justify-between border rounded-lg p-3">
                    <span className="text-sm font-medium">{j?.title || "Unknown"}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{m.status}</Badge>
                      <span className="text-sm font-semibold">{m.overall_score ? `${m.overall_score}%` : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {candidate.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{candidate.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Metadata</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>Source: {candidate.source || "Direct"}</div>
          <div>Added: {format(new Date(candidate.created_at), "dd MMM yyyy, hh:mm a")}</div>
          <div>Updated: {format(new Date(candidate.updated_at), "dd MMM yyyy, hh:mm a")}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function EditCandidateDialog({ candidate, open, onOpenChange, onSaved }: { candidate: any; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: candidate.full_name || "",
    email: candidate.email || "",
    phone: candidate.phone || "",
    location: candidate.location || "",
    current_company: candidate.current_company || "",
    current_designation: candidate.current_designation || "",
    experience_years: candidate.experience_years?.toString() || "",
    current_salary: candidate.current_salary?.toString() || "",
    expected_salary: candidate.expected_salary?.toString() || "",
    skills: (candidate.skills || []).join(", "),
    education: candidate.education || "",
    notice_period: candidate.notice_period || "",
    notes: candidate.notes || "",
  });

  const handleSave = async () => {
    if (!form.full_name) { toast({ title: "Error", description: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("candidates").update({
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      location: form.location || null,
      current_company: form.current_company || null,
      current_designation: form.current_designation || null,
      experience_years: form.experience_years ? Number(form.experience_years) : null,
      current_salary: form.current_salary ? Number(form.current_salary) : null,
      expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()) : [],
      education: form.education || null,
      notice_period: form.notice_period || null,
      notes: form.notes || null,
    }).eq("id", candidate.id);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Candidate updated!" });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Pencil className="size-4 mr-2" /> Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Candidate</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><Label>Education</Label><Input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Company</Label><Input value={form.current_company} onChange={e => setForm(f => ({ ...f, current_company: e.target.value }))} /></div>
            <div><Label>Designation</Label><Input value={form.current_designation} onChange={e => setForm(f => ({ ...f, current_designation: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Experience</Label><Input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} /></div>
            <div><Label>Current Salary</Label><Input type="number" value={form.current_salary} onChange={e => setForm(f => ({ ...f, current_salary: e.target.value }))} /></div>
            <div><Label>Expected Salary</Label><Input type="number" value={form.expected_salary} onChange={e => setForm(f => ({ ...f, expected_salary: e.target.value }))} /></div>
          </div>
          <div><Label>Skills</Label><Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} /></div>
          <div><Label>Notice Period</Label><Input value={form.notice_period} onChange={e => setForm(f => ({ ...f, notice_period: e.target.value }))} /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
