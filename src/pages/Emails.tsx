import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Mail, Send, CheckCircle, XCircle, Clock, FileEdit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700" },
  pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approved", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700" },
};

export default function Emails() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["emails", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("email_queue")
        .select("*, candidates:related_candidate_id(full_name), jobs:related_job_id(title)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as "draft" | "pending_approval" | "approved" | "rejected" | "sent" | "failed");
      const { data } = await q;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "approved") {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = user?.id;
      }
      await supabase.from("email_queue").update(updates).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      toast({ title: "Email status updated" });
    },
  });

  const stats = {
    draft: emails.filter((e: any) => e.status === "draft").length,
    pending: emails.filter((e: any) => e.status === "pending_approval").length,
    approved: emails.filter((e: any) => e.status === "approved").length,
    sent: emails.filter((e: any) => e.status === "sent").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Emails</h1>
          <p className="text-muted-foreground">Email approval queue & management</p>
        </div>
        <Button onClick={() => setShowComposeDialog(true)} className="gap-2">
          <Plus className="size-4" /> Compose
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="cursor-pointer" onClick={() => setStatusFilter("draft")}><CardContent className="py-4 flex items-center gap-3"><FileEdit className="size-5 text-slate-500" /><div><p className="text-2xl font-bold">{stats.draft}</p><p className="text-xs text-muted-foreground">Drafts</p></div></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("pending_approval")}><CardContent className="py-4 flex items-center gap-3"><Clock className="size-5 text-yellow-500" /><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("approved")}><CardContent className="py-4 flex items-center gap-3"><CheckCircle className="size-5 text-green-500" /><div><p className="text-2xl font-bold">{stats.approved}</p><p className="text-xs text-muted-foreground">Approved</p></div></CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("sent")}><CardContent className="py-4 flex items-center gap-3"><Send className="size-5 text-blue-500" /><div><p className="text-2xl font-bold">{stats.sent}</p><p className="text-xs text-muted-foreground">Sent</p></div></CardContent></Card>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="pending_approval">Pending Approval</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : emails.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No emails found.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email: any) => {
                  const cfg = statusConfig[email.status] || statusConfig.draft;
                  return (
                    <TableRow key={email.id} className="cursor-pointer" onClick={() => setSelectedEmail(email)}>
                      <TableCell>
                        <p className="font-medium">{email.recipient_name || email.recipient_email}</p>
                        <p className="text-xs text-muted-foreground">{email.recipient_email}</p>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{email.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {email.candidates?.full_name && <span>Candidate: {email.candidates.full_name}</span>}
                        {email.jobs?.title && <span className="block">Job: {email.jobs.title}</span>}
                      </TableCell>
                      <TableCell><Badge className={cfg.color}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-sm">{format(new Date(email.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {email.status === "pending_approval" && (
                            <>
                              <Button size="sm" variant="ghost" className="text-green-600 h-7" onClick={() => updateStatus.mutate({ id: email.id, status: "approved" })}>
                                Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 h-7" onClick={() => updateStatus.mutate({ id: email.id, status: "rejected" })}>
                                Reject
                              </Button>
                            </>
                          )}
                          {email.status === "draft" && (
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => updateStatus.mutate({ id: email.id, status: "pending_approval" })}>
                              Submit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Email Details</DialogTitle></DialogHeader>
          {selectedEmail && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Badge className={statusConfig[selectedEmail.status]?.color || ""}>{statusConfig[selectedEmail.status]?.label}</Badge>
                {selectedEmail.template_type && <Badge variant="outline">{selectedEmail.template_type}</Badge>}
              </div>
              <div><p className="text-sm text-muted-foreground">To</p><p className="font-medium">{selectedEmail.recipient_name} &lt;{selectedEmail.recipient_email}&gt;</p></div>
              <div><p className="text-sm text-muted-foreground">Subject</p><p className="font-medium">{selectedEmail.subject}</p></div>
              <div><p className="text-sm text-muted-foreground">Body</p><div className="text-sm whitespace-pre-wrap border rounded p-3 bg-muted/30 max-h-[300px] overflow-y-auto">{selectedEmail.body}</div></div>
              {selectedEmail.error_message && (
                <div><p className="text-sm text-muted-foreground">Error</p><p className="text-sm text-destructive">{selectedEmail.error_message}</p></div>
              )}
              {selectedEmail.sent_at && <p className="text-xs text-muted-foreground">Sent: {format(new Date(selectedEmail.sent_at), "MMM d, yyyy HH:mm")}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ComposeDialog open={showComposeDialog} onOpenChange={setShowComposeDialog} userId={user?.id} />
    </div>
  );
}

function ComposeDialog({ open, onOpenChange, userId }: { open: boolean; onOpenChange: (v: boolean) => void; userId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("email_queue").insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        subject,
        body,
        created_by: userId,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Email drafted" });
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      onOpenChange(false);
      setRecipientEmail(""); setRecipientName(""); setSubject(""); setBody("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Compose Email</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Recipient Name</label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium">Recipient Email *</label>
              <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="john@example.com" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Subject *</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject..." />
          </div>
          <div>
            <label className="text-sm font-medium">Body *</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Email body..." rows={8} />
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!recipientEmail || !subject || !body || createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Saving..." : "Save as Draft"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
