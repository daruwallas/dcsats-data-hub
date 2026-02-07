import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, Search, IndianRupee, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function HiredCandidates() {
  const [search, setSearch] = useState("");

  const { data: hired = [], isLoading } = useQuery({
    queryKey: ["hired-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hired_candidates")
        .select(`*, candidate:candidates(full_name, email, phone), job:jobs(title), company:companies(name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = hired.filter((h: any) =>
    !search || h.candidate?.full_name?.toLowerCase().includes(search.toLowerCase()) || h.job?.title?.toLowerCase().includes(search.toLowerCase()) || h.company?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = hired.reduce((s: number, h: any) => s + (h.placement_fee || 0), 0);
  const avgSalary = hired.length ? Math.round(hired.reduce((s: number, h: any) => s + (h.offer_salary || 0), 0) / hired.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="size-6 text-primary" /> Hired Candidates
        </h1>
        <p className="text-sm text-muted-foreground">All successfully placed candidates</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Hired", value: hired.length, icon: UserCheck },
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee },
          { label: "Avg Salary", value: `₹${avgSalary.toLocaleString()}`, icon: IndianRupee },
          { label: "Companies", value: new Set(hired.map((h: any) => h.company?.name).filter(Boolean)).size, icon: Building2 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <s.icon className="size-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search hired candidates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Offer Salary</TableHead>
                <TableHead>Placement Fee</TableHead>
                <TableHead>Offer Date</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Fee Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hired candidates found</TableCell></TableRow>
              ) : filtered.map((h: any) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.candidate?.full_name || "—"}</TableCell>
                  <TableCell>{h.job?.title || "—"}</TableCell>
                  <TableCell>{h.company?.name || "—"}</TableCell>
                  <TableCell>{h.offer_salary ? `₹${h.offer_salary.toLocaleString()}` : "—"}</TableCell>
                  <TableCell>{h.placement_fee ? `₹${h.placement_fee.toLocaleString()}` : "—"}</TableCell>
                  <TableCell>{h.offer_date ? format(new Date(h.offer_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>{h.joining_date ? format(new Date(h.joining_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      h.fee_status === "paid" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      h.fee_status === "overdue" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                      "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }>
                      {h.fee_status || "pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
