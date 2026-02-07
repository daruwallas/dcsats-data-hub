import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MapPin, Briefcase, IndianRupee, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  shortlisted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  interview: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  offered: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  hired: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  on_hold: "bg-muted text-muted-foreground",
};

export default function Candidates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", location: "", current_company: "", current_designation: "", experience_years: "", current_salary: "", expected_salary: "", skills: "", education: "", notice_period: "", notes: "" });

  const { data: candidates = [], isLoading, refetch } = useQuery({
    queryKey: ["candidates", statusFilter],
    queryFn: async () => {
      let q = supabase.from("candidates").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = candidates.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    if (!form.full_name) { toast({ title: "Error", description: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("candidates").insert({
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
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Candidate added!" });
    setDialogOpen(false);
    setForm({ full_name: "", email: "", phone: "", location: "", current_company: "", current_designation: "", experience_years: "", current_salary: "", expected_salary: "", skills: "", education: "", notice_period: "", notes: "" });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground text-sm">{candidates.length} total candidates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" /> Add Candidate</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Candidate</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="John Doe" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                <div><Label>Education</Label><Input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Current Company</Label><Input value={form.current_company} onChange={e => setForm(f => ({ ...f, current_company: e.target.value }))} /></div>
                <div><Label>Designation</Label><Input value={form.current_designation} onChange={e => setForm(f => ({ ...f, current_designation: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Experience (yrs)</Label><Input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} /></div>
                <div><Label>Current Salary</Label><Input type="number" value={form.current_salary} onChange={e => setForm(f => ({ ...f, current_salary: e.target.value }))} /></div>
                <div><Label>Expected Salary</Label><Input type="number" value={form.expected_salary} onChange={e => setForm(f => ({ ...f, expected_salary: e.target.value }))} /></div>
              </div>
              <div><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Notice Period</Label><Input value={form.notice_period} onChange={e => setForm(f => ({ ...f, notice_period: e.target.value }))} placeholder="30 days" /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">{saving ? "Saving..." : "Add Candidate"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or skills..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="screening">Screening</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="offered">Offered</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No candidates found.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/candidates/${c.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{c.full_name}</CardTitle>
                    {c.current_designation && <p className="text-xs text-muted-foreground">{c.current_designation}</p>}
                  </div>
                  <Badge className={statusColors[c.status] || ""} variant="secondary">{c.status.replace("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {c.current_company && <div className="flex items-center gap-1"><Briefcase className="size-3" />{c.current_company}</div>}
                <div className="flex flex-wrap gap-3">
                  {c.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{c.location}</span>}
                  {c.experience_years && <span>{c.experience_years} yrs exp</span>}
                  {c.current_salary && <span className="flex items-center gap-1"><IndianRupee className="size-3" />{(c.current_salary/100000).toFixed(1)}L</span>}
                </div>
                {c.skills && c.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">{c.skills.slice(0, 4).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}{c.skills.length > 4 && <Badge variant="outline" className="text-xs">+{c.skills.length - 4}</Badge>}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
