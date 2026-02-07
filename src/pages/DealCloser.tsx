import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Briefcase, Plus, Search, IndianRupee, Calendar, User } from "lucide-react";
import { format } from "date-fns";

export default function DealCloser() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: hiredCandidates = [], isLoading } = useQuery({
    queryKey: ["deal-closer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hired_candidates")
        .select(`
          *,
          candidate:candidates(full_name, email, phone),
          job:jobs(title, company_id),
          company:companies(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["candidates-for-deal"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("id, full_name").eq("status", "offered");
      return data || [];
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-for-deal"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("id, title, company_id").eq("status", "open");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (form: Record<string, string>) => {
      const { error } = await supabase.from("hired_candidates").insert({
        candidate_id: form.candidate_id,
        job_id: form.job_id,
        company_id: form.company_id || null,
        offer_salary: form.offer_salary ? Number(form.offer_salary) : null,
        offer_date: form.offer_date || null,
        joining_date: form.joining_date || null,
        fee_percentage: form.fee_percentage ? Number(form.fee_percentage) : null,
        placement_fee: form.placement_fee ? Number(form.placement_fee) : null,
        fee_status: "pending",
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-closer"] });
      setDialogOpen(false);
      toast({ title: "Deal created successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateFeeMutation = useMutation({
    mutationFn: async ({ id, fee_status }: { id: string; fee_status: string }) => {
      const { error } = await supabase.from("hired_candidates").update({ fee_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-closer"] });
      toast({ title: "Fee status updated" });
    },
  });

  const filtered = hiredCandidates.filter((h: any) => {
    const matchSearch = !search || h.candidate?.full_name?.toLowerCase().includes(search.toLowerCase()) || h.job?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || h.fee_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const feeStatusColor: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    invoiced: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    overdue: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form: Record<string, string> = {};
    fd.forEach((v, k) => (form[k] = v as string));
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="size-6 text-primary" /> Deal Closer
          </h1>
          <p className="text-sm text-muted-foreground">Track offers, negotiations, and placement fees</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" /> New Deal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Deal</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Candidate *</Label>
                  <select name="candidate_id" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {candidates.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Job *</Label>
                  <select name="job_id" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Offer Salary</Label><Input name="offer_salary" type="number" /></div>
                <div className="space-y-1"><Label>Fee %</Label><Input name="fee_percentage" type="number" step="0.1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Offer Date</Label><Input name="offer_date" type="date" /></div>
                <div className="space-y-1"><Label>Joining Date</Label><Input name="joining_date" type="date" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Placement Fee</Label><Input name="placement_fee" type="number" /></div>
                <input type="hidden" name="company_id" value="" />
              </div>
              <div className="space-y-1"><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>Create Deal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Deals", value: hiredCandidates.length, icon: Briefcase },
          { label: "Pending Fees", value: hiredCandidates.filter((h: any) => h.fee_status === "pending").length, icon: IndianRupee },
          { label: "Total Revenue", value: `₹${hiredCandidates.reduce((s: number, h: any) => s + (h.placement_fee || 0), 0).toLocaleString()}`, icon: IndianRupee },
          { label: "This Month", value: hiredCandidates.filter((h: any) => h.offer_date && new Date(h.offer_date).getMonth() === new Date().getMonth()).length, icon: Calendar },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <s.icon className="size-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="invoiced">Invoiced</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Offer Salary</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead>Joining</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No deals found</TableCell></TableRow>
              ) : filtered.map((h: any) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.candidate?.full_name || "—"}</TableCell>
                  <TableCell>{h.job?.title || "—"}</TableCell>
                  <TableCell>{h.company?.name || "—"}</TableCell>
                  <TableCell>{h.offer_salary ? `₹${h.offer_salary.toLocaleString()}` : "—"}</TableCell>
                  <TableCell>{h.placement_fee ? `₹${h.placement_fee.toLocaleString()}` : h.fee_percentage ? `${h.fee_percentage}%` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={feeStatusColor[h.fee_status] || ""}>
                      {h.fee_status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{h.joining_date ? format(new Date(h.joining_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Select value={h.fee_status || "pending"} onValueChange={(v) => updateFeeMutation.mutate({ id: h.id, fee_status: v })}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="invoiced">Invoiced</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
