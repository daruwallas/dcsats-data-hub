import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, LogOut } from "lucide-react";
import dcsLogo from "@/assets/dcs-logo-clean.png";

export default function HROptOut() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [done, setDone] = useState(false);

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["hr-opt-out", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hr_pipeline")
        .select("*, candidates(full_name), jobs(title)")
        .eq("review_token", token!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const optOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hr_pipeline").update({
        status: "opted_out" as const,
        reviewed_at: new Date().toISOString(),
      }).eq("review_token", token!);
      if (error) throw error;
    },
    onSuccess: () => {
      setDone(true);
      qc.invalidateQueries({ queryKey: ["hr-opt-out", token] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!token) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Card><CardContent className="py-12 text-center text-muted-foreground">Invalid link.</CardContent></Card></div>;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  if (done || pipeline?.status === "opted_out") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="size-16 mx-auto text-green-500" />
            <h2 className="text-xl font-bold">Opted Out Successfully</h2>
            <p className="text-muted-foreground text-sm">You will no longer receive review requests for this candidate.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const candidate = pipeline?.candidates as any;
  const job = pipeline?.jobs as any;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-8 space-y-6">
          <div className="flex justify-center"><img src={dcsLogo} alt="DCS Logo" className="h-12 w-12 object-contain" /></div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Opt Out of Review</h2>
            <p className="text-sm text-muted-foreground">
              You&apos;re about to opt out of reviewing <strong>{candidate?.full_name || "this candidate"}</strong>
              {job?.title && <> for the <strong>{job.title}</strong> position</>}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => optOut.mutate()} disabled={optOut.isPending}>
              <LogOut className="size-4 mr-2" /> Opt Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
