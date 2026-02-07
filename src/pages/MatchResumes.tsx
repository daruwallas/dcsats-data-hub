import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/matching/ScoreRing";
import { FileSearch, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function MatchResumes() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const matchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-match", {
        body: { type: "match_resumes", job_description: jobDescription },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResults(data.matches || []);
      if (!data.matches?.length) {
        toast({ title: "No matches", description: "No candidates matched the job description." });
      } else {
        toast({ title: `Found ${data.matches.length} matches` });
      }
    },
    onError: (e: any) => {
      toast({ title: "Matching failed", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Match Resumes</h1>
        <p className="text-muted-foreground">Paste a job description to find matching candidates</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
          />
          <Button
            onClick={() => matchMutation.mutate()}
            disabled={!jobDescription.trim() || matchMutation.isPending}
            className="gap-2"
          >
            {matchMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}
            {matchMutation.isPending ? "Analyzing..." : "Find Matching Candidates"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Results ({results.length} candidates)</h2>
          {results.map((r: any, i: number) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/candidates/${r.candidate.id}`)}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <ScoreRing score={r.score} size={52} strokeWidth={4} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{r.candidate.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {(r.candidate.skills || []).slice(0, 5).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.candidate.experience_years || 0} yrs exp · {r.candidate.location || "N/A"}
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
