import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScoreRing } from "@/components/matching/ScoreRing";
import { Target, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MatchStatus = "new" | "reviewed" | "shortlisted" | "rejected" | "hired";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewed: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  hired: "bg-emerald-100 text-emerald-800",
};

export default function Matches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "all">("all");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [selectedJob, setSelectedJob] = useState("");

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("matches")
        .select("*, candidates(full_name, skills, location, experience_years), jobs(title, companies(name))")
        .order("overall_score", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as MatchStatus);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["all-candidates-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("id, full_name").order("full_name");
      return data || [];
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["all-jobs-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("id, title").eq("status", "open").order("title");
      return data || [];
    },
  });

  const runMatchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-match", {
        body: { type: "power_match", candidate_id: selectedCandidate, job_id: selectedJob },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Match scored!", description: `Overall score: ${data.scores?.overall_score || "N/A"}` });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setShowRunDialog(false);
    },
    onError: (e: any) => {
      toast({ title: "Match failed", description: e.message, variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MatchStatus }) => {
      await supabase.from("matches").update({ status }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Status updated" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Power Match</h1>
          <p className="text-muted-foreground">AI-powered candidate-job matching</p>
        </div>
        <Button onClick={() => setShowRunDialog(true)} className="gap-2">
          <Target className="size-4" /> Run Match
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MatchStatus | "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Matches Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : matches.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No matches found. Run a match to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match: any) => (
            <Card
              key={match.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedMatch(match)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">{match.candidates?.full_name}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {match.jobs?.title} — {match.jobs?.companies?.name}
                    </p>
                  </div>
                  <ScoreRing score={match.overall_score || 0} size={48} strokeWidth={4} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[match.status] || ""}>{match.status}</Badge>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Skill: {match.skill_score || 0}</span>
                    <span>Exp: {match.experience_score || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Match Detail Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && <MatchDetail match={selectedMatch} onUpdateStatus={(status: MatchStatus) => {
            updateStatus.mutate({ id: selectedMatch.id, status });
            setSelectedMatch({ ...selectedMatch, status });
          }} />}
        </DialogContent>
      </Dialog>

      {/* Run Match Dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Run Power Match</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Candidate</label>
              <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                <SelectTrigger><SelectValue placeholder="Select candidate" /></SelectTrigger>
                <SelectContent>
                  {candidates.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Job</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((j: any) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => runMatchMutation.mutate()}
              disabled={!selectedCandidate || !selectedJob || runMatchMutation.isPending}
              className="w-full gap-2"
            >
              {runMatchMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
              {runMatchMutation.isPending ? "Scoring..." : "Run AI Match"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchDetail({ match, onUpdateStatus }: { match: any; onUpdateStatus: (s: MatchStatus) => void }) {
  const breakdown = match.score_breakdown || {};
  const scores = [
    { label: "Skills", score: match.skill_score || 0 },
    { label: "Experience", score: match.experience_score || 0 },
    { label: "Education", score: match.education_score || 0 },
    { label: "Location", score: match.location_score || 0 },
    { label: "Salary", score: match.salary_score || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ScoreRing score={match.overall_score || 0} size={80} strokeWidth={6} label="Overall" />
        <div>
          <p className="font-semibold">{match.candidates?.full_name}</p>
          <p className="text-sm text-muted-foreground">{match.jobs?.title} — {match.jobs?.companies?.name}</p>
          <Badge className={`mt-1 ${statusColors[match.status] || ""}`}>{match.status}</Badge>
        </div>
      </div>

      <div className="flex justify-around">
        {scores.map((s) => <ScoreRing key={s.label} score={s.score} size={52} strokeWidth={4} label={s.label} />)}
      </div>

      {breakdown.strengths && (
        <div>
          <p className="text-sm font-medium mb-1">Strengths</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {breakdown.strengths.map((s: string, i: number) => <li key={i}>✅ {s}</li>)}
          </ul>
        </div>
      )}

      {breakdown.gaps && (
        <div>
          <p className="text-sm font-medium mb-1">Gaps</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {breakdown.gaps.map((g: string, i: number) => <li key={i}>⚠️ {g}</li>)}
          </ul>
        </div>
      )}

      {breakdown.recommendation && (
        <div>
          <p className="text-sm font-medium mb-1">Recommendation</p>
          <p className="text-sm text-muted-foreground">{breakdown.recommendation}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Select value={match.status} onValueChange={onUpdateStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
