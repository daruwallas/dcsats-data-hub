import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, GraduationCap, IndianRupee, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statuses = ["new", "screening", "shortlisted", "interview", "offered", "hired", "rejected", "on_hold"] as const;

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("candidates").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("candidates").update({ status: status as any }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["candidate", id] }); toast({ title: "Status updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!candidate) return <div className="text-center py-12 text-muted-foreground">Candidate not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/candidates")}><ArrowLeft className="size-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{candidate.full_name}</h1>
          {candidate.current_designation && <p className="text-muted-foreground">{candidate.current_designation} {candidate.current_company ? `at ${candidate.current_company}` : ""}</p>}
        </div>
        <Select value={candidate.status} onValueChange={(v) => updateStatus.mutate(v)}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {candidate.email && <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{candidate.email}</div>}
            {candidate.phone && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{candidate.phone}</div>}
            {candidate.location && <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{candidate.location}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Professional</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {candidate.current_company && <div className="flex items-center gap-2"><Briefcase className="size-4 text-muted-foreground" />{candidate.current_company}</div>}
            {candidate.education && <div className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" />{candidate.education}</div>}
            {candidate.experience_years !== null && <div>Experience: {candidate.experience_years} years</div>}
            {candidate.notice_period && <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" />Notice: {candidate.notice_period}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Compensation</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Current Salary</span><span className="flex items-center gap-1"><IndianRupee className="size-3" />{candidate.current_salary ? `${(candidate.current_salary/100000).toFixed(1)}L` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expected Salary</span><span className="flex items-center gap-1"><IndianRupee className="size-3" />{candidate.expected_salary ? `${(candidate.expected_salary/100000).toFixed(1)}L` : "—"}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
          <CardContent>
            {candidate.skills && candidate.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">{candidate.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>
            ) : <p className="text-sm text-muted-foreground">No skills listed</p>}
          </CardContent>
        </Card>
      </div>

      {candidate.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{candidate.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Metadata</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>Source: {candidate.source || "Direct"}</div>
          <div>Added: {format(new Date(candidate.created_at), "dd MMM yyyy, hh:mm a")}</div>
          <div>Updated: {format(new Date(candidate.updated_at), "dd MMM yyyy, hh:mm a")}</div>
        </CardContent>
      </Card>
    </div>
  );
}
