import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Search, AlertTriangle, CheckCircle, Clock, BellRing } from "lucide-react";
import { format } from "date-fns";

export default function MoneyAlerts() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["money-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("money_alerts")
        .select(`*, hired_candidate:hired_candidates(*, candidate:candidates(full_name), job:jobs(title), company:companies(name))`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const toggleResolved = useMutation({
    mutationFn: async ({ id, is_resolved }: { id: string; is_resolved: boolean }) => {
      const { error } = await supabase.from("money_alerts").update({ is_resolved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-alerts"] });
      toast({ title: "Alert updated" });
    },
  });

  const filtered = alerts.filter((a: any) => {
    const matchSearch = !search || a.alert_type?.toLowerCase().includes(search.toLowerCase()) || a.hired_candidate?.candidate?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.alert_type === typeFilter;
    const matchResolved = resolvedFilter === "all" || (resolvedFilter === "resolved" ? a.is_resolved : !a.is_resolved);
    return matchSearch && matchType && matchResolved;
  });

  const alertTypes = [...new Set(alerts.map((a: any) => a.alert_type))];
  const unresolvedCount = alerts.filter((a: any) => !a.is_resolved).length;
  const overdueCount = alerts.filter((a: any) => !a.is_resolved && a.due_date && new Date(a.due_date) < new Date()).length;
  const totalAmount = alerts.filter((a: any) => !a.is_resolved).reduce((s: number, a: any) => s + (a.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="size-6 text-primary" /> Money Alerts
        </h1>
        <p className="text-sm text-muted-foreground">Financial tracking for placements, fees, and payment alerts</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Alerts", value: alerts.length, icon: BellRing, color: "text-primary" },
          { label: "Unresolved", value: unresolvedCount, icon: AlertTriangle, color: "text-amber-400" },
          { label: "Overdue", value: overdueCount, icon: Clock, color: "text-red-400" },
          { label: "Outstanding", value: `₹${totalAmount.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <s.icon className={`size-8 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search alerts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {alertTypes.map((t: any) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No alerts found</TableCell></TableRow>
              ) : filtered.map((a: any) => {
                const isOverdue = !a.is_resolved && a.due_date && new Date(a.due_date) < new Date();
                return (
                  <TableRow key={a.id}>
                    <TableCell><Badge variant="outline">{a.alert_type}</Badge></TableCell>
                    <TableCell>{a.hired_candidate?.candidate?.full_name || "—"}</TableCell>
                    <TableCell>{a.hired_candidate?.job?.title || "—"}</TableCell>
                    <TableCell className="font-medium">{a.amount ? `₹${a.amount.toLocaleString()}` : "—"}</TableCell>
                    <TableCell>
                      <span className={isOverdue ? "text-red-400 font-medium" : ""}>
                        {a.due_date ? format(new Date(a.due_date), "dd MMM yyyy") : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {a.is_resolved ? (
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="size-3 mr-1" />Resolved</Badge>
                      ) : isOverdue ? (
                        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="size-3 mr-1" />Overdue</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="size-3 mr-1" />Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant={a.is_resolved ? "outline" : "default"} onClick={() => toggleResolved.mutate({ id: a.id, is_resolved: !a.is_resolved })}>
                        {a.is_resolved ? "Reopen" : "Resolve"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
