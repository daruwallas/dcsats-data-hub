import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreRing } from "@/components/matching/ScoreRing";
import { Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function ReverseMatch() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const { data: candidates = [] } = useQuery({
    queryKey: ["all-candidates-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("id, full_name, skills, experience_years, location").order("full_name");
      return data || [];
    },
  });

  const candidate = candidates.find((c: any) => c.id === selectedCandidate);

  const matchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-match", {
        body: { type: "reverse_match", candidate_id: selectedCandidate },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResults(data.matches || []);
      if (!data.matches?.length) {
        toast({ title: "No matches", description: "No open jobs matched this candidate." });
      } else {
        toast({ title: `Found ${data.matches.length} matching jobs` });
      }
    },
    onError: (e: any) => {
      toast({ title: "Matching failed", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reverse Match</h1>
        <p className="text-muted-foreground">Select a candidate to find matching open jobs</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Select Candidate</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedCandidate} onValueChange={(v) => { setSelectedCandidate(v); setResults([]); }}>
            <SelectTrigger><SelectValue placeholder="Choose a candidate" /></SelectTrigger>
            <SelectContent>
              {candidates.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {candidate && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Skills: {(candidate.skills || []).join(", ") || "None listed"}</p>
              <p>Experience: {candidate.experience_years || 0} years · Location: {candidate.location || "N/A"}</p>
            </div>
          )}

          <Button
            onClick={() => matchMutation.mutate()}
            disabled={!selectedCandidate || matchMutation.isPending}
            className="gap-2"
          >
            {matchMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            {matchMutation.isPending ? "Finding jobs..." : "Find Matching Jobs"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Results ({results.length} jobs)</h2>
          {results.map((r: any, i: number) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/jobs/${r.job.id}`)}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <ScoreRing score={r.score} size={52} strokeWidth={4} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{r.job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.job.companies?.name || "N/A"} · {r.job.location || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.job.experience_min || 0}-{r.job.experience_max || "any"} yrs · {(r.job.skills || []).slice(0, 4).join(", ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline">{r.score}% match</Badge>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{r.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
