import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, User, Briefcase, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import dcsLogo from "@/assets/dcs-logo-clean.png";

export default function HRSwipeReview() {
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contact");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ["hr-swipe", contactId],
    queryFn: async () => {
      let q = supabase
        .from("hr_pipeline")
        .select("*, candidates(full_name, current_company, current_designation, experience_years, skills, location, education, resume_url), jobs(title, companies(name))")
        .in("status", ["pending", "sent"]);
      if (contactId) q = q.eq("contact_id", contactId);
      const { data, error } = await q.order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.from("hr_pipeline").update({
        status,
        reviewed_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-swipe", contactId] });
      if (currentIndex < pipelines.length - 1) setCurrentIndex(i => i + 1);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  if (pipelines.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full"><CardContent className="py-12 text-center space-y-3">
          <CheckCircle className="size-12 mx-auto text-green-500" />
          <h2 className="text-lg font-bold">All Done!</h2>
          <p className="text-sm text-muted-foreground">No more candidates to review.</p>
        </CardContent></Card>
      </div>
    );
  }

  const current = pipelines[currentIndex];
  const candidate = current?.candidates as any;
  const job = current?.jobs as any;

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card><CardContent className="py-12 text-center"><CheckCircle className="size-12 mx-auto text-green-500 mb-3" /><p className="font-semibold">All candidates reviewed!</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dcsLogo} alt="DCS Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold">Quick Review</h1>
              <p className="text-xs text-muted-foreground">{currentIndex + 1} of {pipelines.length}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" disabled={currentIndex === 0} onClick={() => setCurrentIndex(i => i - 1)}><ChevronLeft className="size-4" /></Button>
            <Button variant="ghost" size="icon" disabled={currentIndex >= pipelines.length - 1} onClick={() => setCurrentIndex(i => i + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        <Card className="overflow-hidden">
          {/* Candidate card */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{candidate?.full_name}</h3>
                {candidate?.current_designation && <p className="text-sm text-muted-foreground">{candidate.current_designation}</p>}
              </div>
            </div>

            {job && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                For: <span className="font-medium text-foreground">{job.title}</span>
                {job.companies?.name && <span> at {job.companies.name}</span>}
              </div>
            )}

            <div className="space-y-2 text-sm">
              {candidate?.current_company && <div className="flex items-center gap-2"><Briefcase className="size-3.5 text-muted-foreground" />{candidate.current_company}</div>}
              {candidate?.location && <div className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" />{candidate.location}</div>}
              {candidate?.experience_years && <div>Experience: {candidate.experience_years} years</div>}
              {candidate?.education && <div>{candidate.education}</div>}
            </div>

            {candidate?.skills && candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {candidate.skills.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
              </div>
            )}

            {candidate?.resume_url && (
              <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">View Resume →</a>
            )}
          </div>

          {/* Action buttons */}
          <div className="border-t p-4 flex gap-3">
            <Button variant="destructive" className="flex-1" onClick={() => respond.mutate({ id: current.id, status: "rejected" })} disabled={respond.isPending}>
              <XCircle className="size-4 mr-2" /> Pass
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => respond.mutate({ id: current.id, status: "accepted" })} disabled={respond.isPending}>
              <CheckCircle className="size-4 mr-2" /> Accept
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
