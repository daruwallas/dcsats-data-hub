import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Loader2,
  Plus,
  Search,
  Eye,
  Link as LinkIcon,
  Copy,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

type PipelineStatus = "pending" | "sent" | "reviewed" | "accepted" | "rejected" | "opted_out";

const statusConfig: Record<PipelineStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-800 border-blue-200" },
  reviewed: { label: "Reviewed", className: "bg-purple-100 text-purple-800 border-purple-200" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  opted_out: { label: "Opted Out", className: "bg-slate-100 text-slate-800 border-slate-200" },
};

export default function HRPipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Form state for add dialog
  const [formCandidateId, setFormCandidateId] = useState("");
  const [formJobId, setFormJobId] = useState("");
  const [formContactId, setFormContactId] = useState("");

  const { data: pipeline = [], isLoading } = useQuery({
    queryKey: ["hr-pipeline", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("hr_pipeline")
        .select(
          "*, candidates(id, full_name, email, phone, skills), jobs(id, title, companies(name)), company_contacts(id, name, email, designation)"
        )
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as PipelineStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["pipeline-candidates"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("id, full_name").order("full_name");
      return data || [];
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["pipeline-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, company_id, companies(name)")
        .eq("status", "open")
        .order("title");
      return data || [];
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["pipeline-contacts", formJobId],
    enabled: !!formJobId,
    queryFn: async () => {
      const job = jobs.find((j: any) => j.id === formJobId);
      if (!job?.company_id) return [];
      const { data } = await supabase
        .from("company_contacts")
        .select("id, name, email, designation")
        .eq("company_id", job.company_id)
        .order("name");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID();
      const { error } = await supabase.from("hr_pipeline").insert({
        candidate_id: formCandidateId,
        job_id: formJobId,
        contact_id: formContactId || null,
        review_token: token,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Pipeline entry added" });
      queryClient.invalidateQueries({ queryKey: ["hr-pipeline"] });
      setShowAddDialog(false);
      setFormCandidateId("");
      setFormJobId("");
      setFormContactId("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PipelineStatus }) => {
      const { error } = await supabase.from("hr_pipeline").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["hr-pipeline"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = pipeline.filter((entry: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      entry.candidates?.full_name?.toLowerCase().includes(s) ||
      entry.jobs?.title?.toLowerCase().includes(s) ||
      entry.jobs?.companies?.name?.toLowerCase().includes(s) ||
      entry.company_contacts?.name?.toLowerCase().includes(s)
    );
  });

  // Stats
  const stats = pipeline.reduce(
    (acc: Record<string, number>, e: any) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const copyReviewLink = (token: string) => {
    const url = `${window.location.origin}/hr-review?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Review link copied!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">HR Pipeline</h1>
          <p className="text-muted-foreground">Track candidate reviews by HR contacts</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="size-4" /> Add to Pipeline
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {(Object.entries(statusConfig) as [PipelineStatus, typeof statusConfig[PipelineStatus]][]).map(
          ([key, config]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                statusFilter === key ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            >
              <CardContent className="py-3 px-4 text-center">
                <p className="text-2xl font-bold">{stats[key] || 0}</p>
                <Badge variant="outline" className={`text-[10px] ${config.className}`}>
                  {config.label}
                </Badge>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by candidate, job, company, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PipelineStatus | "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pipeline entries found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Candidate</TableHead>
                <TableHead>Job / Company</TableHead>
                <TableHead>HR Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry: any) => (
                <TableRow key={entry.id} className="table-row">
                  <TableCell className="table-cell">
                    <button
                      className="font-medium hover:underline text-left"
                      onClick={() => navigate(`/candidates/${entry.candidates?.id}`)}
                    >
                      {entry.candidates?.full_name || "Unknown"}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {entry.candidates?.email || ""}
                    </p>
                  </TableCell>
                  <TableCell className="table-cell">
                    <button
                      className="hover:underline text-left"
                      onClick={() => navigate(`/jobs/${entry.jobs?.id}`)}
                    >
                      {entry.jobs?.title || "Unknown"}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {entry.jobs?.companies?.name || ""}
                    </p>
                  </TableCell>
                  <TableCell className="table-cell">
                    {entry.company_contacts ? (
                      <div>
                        <p className="text-sm">{entry.company_contacts.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.company_contacts.designation || entry.company_contacts.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="table-cell">
                    <Select
                      value={entry.status}
                      onValueChange={(v) =>
                        updateStatusMutation.mutate({ id: entry.id, status: v as PipelineStatus })
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusConfig[entry.status as PipelineStatus]?.className || ""}`}
                        >
                          {statusConfig[entry.status as PipelineStatus]?.label || entry.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="table-cell max-w-[200px]">
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.feedback || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="table-cell text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(entry.created_at), "dd MMM yyyy")}
                    {entry.reviewed_at && (
                      <p className="flex items-center gap-1 mt-0.5">
                        <CheckCircle className="size-3 text-green-500" />
                        {format(new Date(entry.reviewed_at), "dd MMM")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="table-cell text-right">
                    <div className="flex justify-end gap-1">
                      {entry.review_token && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyReviewLink(entry.review_token)}
                          title="Copy review link"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedEntry(entry)}
                        title="View details"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pipeline Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Candidate</p>
                  <p className="font-medium">{selectedEntry.candidates?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedEntry.candidates?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Job</p>
                  <p className="font-medium">{selectedEntry.jobs?.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedEntry.jobs?.companies?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">HR Contact</p>
                  <p className="font-medium">{selectedEntry.company_contacts?.name || "Not assigned"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedEntry.company_contacts?.email || ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge
                    variant="outline"
                    className={statusConfig[selectedEntry.status as PipelineStatus]?.className || ""}
                  >
                    {statusConfig[selectedEntry.status as PipelineStatus]?.label || selectedEntry.status}
                  </Badge>
                </div>
              </div>

              {selectedEntry.feedback && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Feedback</p>
                  <p className="text-sm bg-muted/50 rounded-md p-3">{selectedEntry.feedback}</p>
                </div>
              )}

              {selectedEntry.candidates?.skills?.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Candidate Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedEntry.candidates.skills.map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {format(new Date(selectedEntry.created_at), "dd MMM yyyy, hh:mm a")}</p>
                {selectedEntry.reviewed_at && (
                  <p>Reviewed: {format(new Date(selectedEntry.reviewed_at), "dd MMM yyyy, hh:mm a")}</p>
                )}
              </div>

              {selectedEntry.review_token && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 w-full"
                  onClick={() => copyReviewLink(selectedEntry.review_token)}
                >
                  <LinkIcon className="size-3.5" /> Copy Review Link
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Pipeline Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to HR Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Candidate</label>
              <Select value={formCandidateId} onValueChange={setFormCandidateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Job</label>
              <Select value={formJobId} onValueChange={(v) => { setFormJobId(v); setFormContactId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j: any) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title} — {j.companies?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formJobId && contacts.length > 0 && (
              <div>
                <label className="text-sm font-medium">HR Contact (optional)</label>
                <Select value={formContactId} onValueChange={setFormContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.designation || c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!formCandidateId || !formJobId || addMutation.isPending}
              className="w-full gap-2"
            >
              {addMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {addMutation.isPending ? "Adding..." : "Add to Pipeline"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
