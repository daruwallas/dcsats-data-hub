import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Briefcase, MapPin, Building2, IndianRupee } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs"> & { companies?: { name: string } | null };

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  filled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function Jobs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", location: "", job_type: "", skills: "", salary_min: "", salary_max: "", experience_min: "", experience_max: "", openings: "1", priority: "medium" as string, status: "draft" as string });

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ["jobs", statusFilter, priorityFilter],
    queryFn: async () => {
      let q = supabase.from("jobs").select("*, companies(name)").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
      if (priorityFilter !== "all") q = q.eq("priority", priorityFilter as any);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Job[];
    },
  });

  const filtered = jobs.filter((j) => j.title.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.title) { toast({ title: "Error", description: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("jobs").insert({
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      job_type: form.job_type || null,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()) : [],
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      experience_min: form.experience_min ? Number(form.experience_min) : null,
      experience_max: form.experience_max ? Number(form.experience_max) : null,
      openings: Number(form.openings) || 1,
      priority: form.priority as any,
      status: form.status as any,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Job created!" });
    setDialogOpen(false);
    setForm({ title: "", description: "", location: "", job_type: "", skills: "", salary_min: "", salary_max: "", experience_min: "", experience_max: "", openings: "1", priority: "medium", status: "draft" });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground text-sm">{jobs.length} total jobs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" /> Add Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Job</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior React Developer" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Mumbai" /></div>
                <div><Label>Job Type</Label><Input value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))} placeholder="Full-time" /></div>
              </div>
              <div><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, TypeScript, Node.js" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Min Salary</Label><Input type="number" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} /></div>
                <div><Label>Max Salary</Label><Input type="number" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Min Exp (yrs)</Label><Input type="number" value={form.experience_min} onChange={e => setForm(f => ({ ...f, experience_min: e.target.value }))} /></div>
                <div><Label>Max Exp (yrs)</Label><Input type="number" value={form.experience_max} onChange={e => setForm(f => ({ ...f, experience_max: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Openings</Label><Input type="number" value={form.openings} onChange={e => setForm(f => ({ ...f, openings: e.target.value }))} /></div>
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
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">{saving ? "Creating..." : "Create Job"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No jobs found. Create your first job to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/jobs/${job.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold leading-tight">{job.title}</CardTitle>
                  <Badge className={priorityColors[job.priority] || ""} variant="secondary">{job.priority}</Badge>
                </div>
                {job.companies?.name && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="size-3.5" />{job.companies.name}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {job.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>}
                  {job.job_type && <span className="flex items-center gap-1"><Briefcase className="size-3" />{job.job_type}</span>}
                  {(job.salary_min || job.salary_max) && (
                    <span className="flex items-center gap-1">
                      <IndianRupee className="size-3" />
                      {job.salary_min && `${(job.salary_min / 100000).toFixed(1)}L`}
                      {job.salary_min && job.salary_max && " - "}
                      {job.salary_max && `${(job.salary_max / 100000).toFixed(1)}L`}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[job.status] || ""} variant="secondary">{job.status.replace("_", " ")}</Badge>
                  <span className="text-xs text-muted-foreground">{job.openings} opening{job.openings !== 1 ? "s" : ""}</span>
                </div>
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    {job.skills.length > 3 && <Badge variant="outline" className="text-xs">+{job.skills.length - 3}</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
