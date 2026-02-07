import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Briefcase, IndianRupee, Building2, Clock, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusFlow = ["draft", "open", "on_hold", "closed", "filled"] as const;

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*, companies(name)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("jobs").update({ status: status as any }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["job", id] }); toast({ title: "Status updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!job) return <div className="text-center py-12 text-muted-foreground">Job not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}><ArrowLeft className="size-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          {job.companies?.name && <p className="text-muted-foreground flex items-center gap-1"><Building2 className="size-4" />{job.companies.name}</p>}
        </div>
        <Select value={job.status} onValueChange={(v) => updateStatus.mutate(v)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusFlow.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Location</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{job.location || "Not specified"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Job Type</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2"><Briefcase className="size-4 text-muted-foreground" />{job.job_type || "Not specified"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Openings</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2"><Users className="size-4 text-muted-foreground" />{job.openings || 1}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Salary Range</span><span className="flex items-center gap-1"><IndianRupee className="size-3" />{job.salary_min ? `${(job.salary_min/100000).toFixed(1)}L` : "—"} - {job.salary_max ? `${(job.salary_max/100000).toFixed(1)}L` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span>{job.experience_min ?? "—"} - {job.experience_max ?? "—"} years</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge variant="secondary">{job.priority}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="flex items-center gap-1"><Clock className="size-3" />{format(new Date(job.created_at), "dd MMM yyyy")}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Skills Required</CardTitle></CardHeader>
          <CardContent>
            {job.skills && job.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">{job.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>
            ) : <p className="text-muted-foreground text-sm">No skills specified</p>}
          </CardContent>
        </Card>
      </div>

      {job.description && (
        <Card>
          <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{job.description}</p></CardContent>
        </Card>
      )}
      {job.requirements && (
        <Card>
          <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{job.requirements}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
