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
import { ArrowLeft, MapPin, Briefcase, IndianRupee, Building2, Clock, Users, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusFlow = ["draft", "open", "on_hold", "closed", "filled"] as const;

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*, companies(name)").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("jobs").update({ status: status as any }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job", id] }); toast({ title: "Status updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Matched candidates
  const { data: matchedCandidates = [] } = useQuery({
    queryKey: ["job-matches", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, overall_score, status, candidates(full_name, current_designation)")
        .eq("job_id", id!)
        .order("overall_score", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Interviews for this job
  const { data: interviews = [] } = useQuery({
    queryKey: ["job-interviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("id, scheduled_at, status, candidates(full_name)")
        .eq("job_id", id!)
        .order("scheduled_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!job) return <div className="text-center py-12 text-muted-foreground">Job not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}><ArrowLeft className="size-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          {job.companies?.name && <p className="text-muted-foreground flex items-center gap-1"><Building2 className="size-4" />{job.companies.name}</p>}
        </div>
        <EditJobDialog job={job} open={editOpen} onOpenChange={setEditOpen} onSaved={() => { qc.invalidateQueries({ queryKey: ["job", id] }); setEditOpen(false); }} />
        <Select value={job.status} onValueChange={(v) => updateStatus.mutate(v)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusFlow.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Location</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{job.location || "Not specified"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Job Type</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2"><Briefcase className="size-4 text-muted-foreground" />{job.job_type || "Not specified"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Openings</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2"><Users className="size-4 text-muted-foreground" />{job.openings || 1}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Salary Range</span><span className="flex items-center gap-1"><IndianRupee className="size-3" />{job.salary_min ? `${(job.salary_min/100000).toFixed(1)}L` : "—"} - {job.salary_max ? `${(job.salary_max/100000).toFixed(1)}L` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span>{job.experience_min ?? "—"} - {job.experience_max ?? "—"} years</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge variant="secondary">{job.priority}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="flex items-center gap-1"><Clock className="size-3" />{format(new Date(job.created_at), "dd MMM yyyy")}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Skills Required</CardTitle></CardHeader>
          <CardContent>
            {job.skills && job.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">{job.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>
            ) : <p className="text-muted-foreground text-sm">No skills specified</p>}
          </CardContent>
        </Card>
      </div>

      {job.description && (
        <Card>
          <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{job.description}</p></CardContent>
        </Card>
      )}
      {job.requirements && (
        <Card>
          <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{job.requirements}</p></CardContent>
        </Card>
      )}

      {/* Matched Candidates */}
      <Card>
        <CardHeader><CardTitle className="text-base">Matched Candidates ({matchedCandidates.length})</CardTitle></CardHeader>
        <CardContent>
          {matchedCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet. Use Power Match to find candidates.</p>
          ) : (
            <div className="space-y-2">
              {matchedCandidates.map(m => {
                const c = m.candidates as any;
                return (
                  <div key={m.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{c?.full_name || "Unknown"}</p>
                      {c?.current_designation && <p className="text-xs text-muted-foreground">{c.current_designation}</p>}
                    </div>
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

      {/* Interview History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Interviews ({interviews.length})</CardTitle></CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interviews scheduled for this job.</p>
          ) : (
            <div className="space-y-2">
              {interviews.map(i => {
                const c = i.candidates as any;
                return (
                  <div key={i.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{c?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(i.scheduled_at), "dd MMM yyyy, hh:mm a")}</p>
                    </div>
                    <Badge variant={i.status === "scheduled" ? "default" : "secondary"}>{i.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EditJobDialog({ job, open, onOpenChange, onSaved }: { job: any; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: job.title || "",
    description: job.description || "",
    requirements: job.requirements || "",
    location: job.location || "",
    job_type: job.job_type || "",
    skills: (job.skills || []).join(", "),
    salary_min: job.salary_min?.toString() || "",
    salary_max: job.salary_max?.toString() || "",
    experience_min: job.experience_min?.toString() || "",
    experience_max: job.experience_max?.toString() || "",
    openings: job.openings?.toString() || "1",
    priority: job.priority || "medium",
  });

  const handleSave = async () => {
    if (!form.title) { toast({ title: "Error", description: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("jobs").update({
      title: form.title,
      description: form.description || null,
      requirements: form.requirements || null,
      location: form.location || null,
      job_type: form.job_type || null,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()) : [],
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      experience_min: form.experience_min ? Number(form.experience_min) : null,
      experience_max: form.experience_max ? Number(form.experience_max) : null,
      openings: Number(form.openings) || 1,
      priority: form.priority as any,
    }).eq("id", job.id);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Job updated!" });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Pencil className="size-4 mr-2" /> Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Job</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          <div><Label>Requirements</Label><Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><Label>Job Type</Label><Input value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))} /></div>
          </div>
          <div><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Min Salary</Label><Input type="number" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} /></div>
            <div><Label>Max Salary</Label><Input type="number" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Min Exp</Label><Input type="number" value={form.experience_min} onChange={e => setForm(f => ({ ...f, experience_min: e.target.value }))} /></div>
            <div><Label>Max Exp</Label><Input type="number" value={form.experience_max} onChange={e => setForm(f => ({ ...f, experience_max: e.target.value }))} /></div>
            <div><Label>Openings</Label><Input type="number" value={form.openings} onChange={e => setForm(f => ({ ...f, openings: e.target.value }))} /></div>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
