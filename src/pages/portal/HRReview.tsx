import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, User, Briefcase, MapPin, GraduationCap } from "lucide-react";
import dcsLogo from "@/assets/dcs-logo-clean.png";

export default function HRReview() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState("");

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["hr-review", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hr_pipeline")
        .select("*, candidates(full_name, email, phone, location, current_company, current_designation, experience_years, skills, education, resume_url), jobs(title, location, company_id, companies(name))")
        .eq("review_token", token!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const respond = useMutation({
    mutationFn: async (status: "accepted" | "rejected") => {
      const { error } = await supabase.from("hr_pipeline").update({
        status,
        feedback: feedback || null,
        reviewed_at: new Date().toISOString(),
      }).eq("review_token", token!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-review", token] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!token) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Card><CardContent className="py-12 text-center text-muted-foreground">Invalid review link.</CardContent></Card></div>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!pipeline) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Card><CardContent className="py-12 text-center text-muted-foreground">Review not found or link expired.</CardContent></Card></div>;
  }

  const candidate = pipeline.candidates as any;
  const job = pipeline.jobs as any;
  const alreadyReviewed = ["accepted", "rejected", "opted_out"].includes(pipeline.status);

  if (alreadyReviewed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            {pipeline.status === "accepted" ? <CheckCircle className="size-16 mx-auto text-green-500" /> : <XCircle className="size-16 mx-auto text-red-500" />}
            <h2 className="text-xl font-bold">Already Reviewed</h2>
            <p className="text-muted-foreground text-sm">You have already {pipeline.status} this candidate.</p>
            {pipeline.feedback && <p className="text-sm border rounded-lg p-3 bg-muted/50">"{pipeline.feedback}"</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <img src={dcsLogo} alt="DCS Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground">DCS ATS</h1>
            <p className="text-xs text-muted-foreground">Candidate Review</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Job info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Position</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold">{job?.title || "Unknown Position"}</h3>
            {job?.companies?.name && <p className="text-sm text-muted-foreground">{job.companies.name}</p>}
            {job?.location && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="size-3" />{job.location}</p>}
          </CardContent>
        </Card>

        {/* Candidate info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Candidate Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{candidate?.full_name}</p>
                {candidate?.current_designation && <p className="text-sm text-muted-foreground">{candidate.current_designation}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {candidate?.current_company && <div className="flex items-center gap-2"><Briefcase className="size-3.5 text-muted-foreground" />{candidate.current_company}</div>}
              {candidate?.location && <div className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" />{candidate.location}</div>}
              {candidate?.experience_years && <div>Experience: {candidate.experience_years} years</div>}
              {candidate?.education && <div className="flex items-center gap-2"><GraduationCap className="size-3.5 text-muted-foreground" />{candidate.education}</div>}
            </div>
            {candidate?.skills && candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">{candidate.skills.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
            )}
            {candidate?.resume_url && (
              <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">View Resume →</a>
            )}
          </CardContent>
        </Card>

        {/* Feedback & actions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Your Review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Feedback (optional)</Label>
              <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Share your thoughts on this candidate..." />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => respond.mutate("accepted")} disabled={respond.isPending}>
                <CheckCircle className="size-4 mr-2" /> Accept
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => respond.mutate("rejected")} disabled={respond.isPending}>
                <XCircle className="size-4 mr-2" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
