import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Clock, MapPin, Video } from "lucide-react";
import { format } from "date-fns";
import dcsLogo from "@/assets/dcs-logo-clean.png";

export default function InterviewSchedule() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get("candidate");

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ["interview-schedule", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*, jobs(title, companies(name))")
        .eq("candidate_id", candidateId!)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!candidateId,
  });

  if (!candidateId) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Card><CardContent className="py-12 text-center text-muted-foreground">Invalid link.</CardContent></Card></div>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src={dcsLogo} alt="DCS Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground">DCS ATS</h1>
            <p className="text-xs text-muted-foreground">Your Interview Schedule</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        <h2 className="text-xl font-bold">Scheduled Interviews</h2>

        {interviews.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No interviews scheduled yet.</CardContent></Card>
        ) : (
          interviews.map((interview) => {
            const job = interview.jobs as any;
            return (
              <Card key={interview.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{job?.title || "Position"}</CardTitle>
                    <Badge variant={interview.status === "scheduled" ? "default" : "secondary"}>{interview.status}</Badge>
                  </div>
                  {job?.companies?.name && <p className="text-sm text-muted-foreground">{job.companies.name}</p>}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    {format(new Date(interview.scheduled_at), "EEEE, dd MMMM yyyy")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    {format(new Date(interview.scheduled_at), "hh:mm a")} ({interview.duration_minutes || 60} min)
                  </div>
                  {interview.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />{interview.location}
                    </div>
                  )}
                  {interview.meeting_link && (
                    <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <Video className="size-4" /> Join Meeting
                    </a>
                  )}
                  {interview.interview_type && <div className="text-muted-foreground">Type: {interview.interview_type}</div>}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
