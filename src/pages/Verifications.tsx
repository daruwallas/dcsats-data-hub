import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, ShieldCheck, Clock, Mail, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  email_sent: { label: "Email Sent", color: "bg-blue-100 text-blue-700", icon: Mail },
  verified: { label: "Verified", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function Verifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["verifications", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("verifications")
        .select("*, candidates(full_name), companies(name), contacts:contact_id(name, email)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as "pending" | "email_sent" | "verified" | "rejected");
      const { data } = await q;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "verified") {
        updates.verified_at = new Date().toISOString();
        updates.verified_by = user?.id;
      }
      await supabase.from("verifications").update(updates).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
      toast({ title: "Status updated" });
    },
  });

  const stats = {
    total: verifications.length,
    pending: verifications.filter((v: any) => v.status === "pending").length,
    emailSent: verifications.filter((v: any) => v.status === "email_sent").length,
    verified: verifications.filter((v: any) => v.status === "verified").length,
    rejected: verifications.filter((v: any) => v.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Verifications</h1>
          <p className="text-muted-foreground">Background verification workflow</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="size-4" /> Add Verification
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card><CardContent className="py-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("pending")}><CardContent className="py-4"><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("email_sent")}><CardContent className="py-4"><p className="text-2xl font-bold text-blue-600">{stats.emailSent}</p><p className="text-xs text-muted-foreground">Email Sent</p></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("verified")}><CardContent className="py-4"><p className="text-2xl font-bold text-green-600">{stats.verified}</p><p className="text-xs text-muted-foreground">Verified</p></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("rejected")}><CardContent className="py-4"><p className="text-2xl font-bold text-red-600">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="email_sent">Email Sent</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : verifications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No verifications found.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map((v: any) => {
                  const cfg = statusConfig[v.status] || statusConfig.pending;
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.candidates?.full_name || "—"}</TableCell>
                      <TableCell>{v.companies?.name || "—"}</TableCell>
                      <TableCell>
                        {v.contacts?.name || "—"}
                        {v.contacts?.email && <span className="text-xs text-muted-foreground block">{v.contacts.email}</span>}
                      </TableCell>
                      <TableCell className="capitalize">{v.verification_type || "employment"}</TableCell>
                      <TableCell><Badge className={cfg.color}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-sm">{format(new Date(v.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Select
                          value={v.status}
                          onValueChange={(s) => updateStatus.mutate({ id: v.id, status: s })}
                        >
                          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="email_sent">Email Sent</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddVerificationDialog open={showAddDialog} onOpenChange={setShowAddDialog} userId={user?.id} />
    </div>
  );
}

function AddVerificationDialog({ open, onOpenChange, userId }: { open: boolean; onOpenChange: (v: boolean) => void; userId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [candidateId, setCandidateId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: candidates = [] } = useQuery({
    queryKey: ["all-candidates-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("id, full_name").order("full_name");
      return data || [];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["all-companies-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name").order("name");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("verifications").insert({
        candidate_id: candidateId,
        company_id: companyId || null,
        notes: notes || null,
        created_by: userId,
        verification_type: "employment",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Verification created" });
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
      onOpenChange(false);
      setCandidateId(""); setCompanyId(""); setNotes("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Verification</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Candidate *</label>
            <Select value={candidateId} onValueChange={setCandidateId}>
              <SelectTrigger><SelectValue placeholder="Select candidate" /></SelectTrigger>
              <SelectContent>
                {candidates.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Company (previous employer)</label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={3} />
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!candidateId || createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Creating..." : "Create Verification"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
