import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, Search, Users, Briefcase, Building2, Target, UserCheck } from "lucide-react";

function DataTable({ data, columns, isLoading }: { data: any[]; columns: { key: string; label: string; render?: (v: any, row: any) => React.ReactNode }[]; isLoading: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow><TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
        ) : data.length === 0 ? (
          <TableRow><TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>
        ) : data.map((row, i) => (
          <TableRow key={row.id || i}>
            {columns.map((c) => (
              <TableCell key={c.key}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function MasterDB() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("candidates");

  const { data: candidates = [], isLoading: loadingC } = useQuery({
    queryKey: ["master-candidates"],
    queryFn: async () => { const { data } = await supabase.from("candidates").select("*").order("created_at", { ascending: false }); return data || []; },
  });

  const { data: jobs = [], isLoading: loadingJ } = useQuery({
    queryKey: ["master-jobs"],
    queryFn: async () => { const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false }); return data || []; },
  });

  const { data: companies = [], isLoading: loadingCo } = useQuery({
    queryKey: ["master-companies"],
    queryFn: async () => { const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false }); return data || []; },
  });

  const { data: matchesData = [], isLoading: loadingM } = useQuery({
    queryKey: ["master-matches"],
    queryFn: async () => { const { data } = await supabase.from("matches").select("*, candidate:candidates(full_name), job:jobs(title)").order("created_at", { ascending: false }); return data || []; },
  });

  const { data: hiredData = [], isLoading: loadingH } = useQuery({
    queryKey: ["master-hired"],
    queryFn: async () => { const { data } = await supabase.from("hired_candidates").select("*, candidate:candidates(full_name), job:jobs(title), company:companies(name)").order("created_at", { ascending: false }); return data || []; },
  });

  const filterFn = (items: any[], keys: string[]) =>
    items.filter((item) => !search || keys.some((k) => String(item[k] || "").toLowerCase().includes(search.toLowerCase())));

  const tabs = [
    { id: "candidates", label: "Candidates", icon: Users, count: candidates.length },
    { id: "jobs", label: "Jobs", icon: Briefcase, count: jobs.length },
    { id: "companies", label: "Companies", icon: Building2, count: companies.length },
    { id: "matches", label: "Matches", icon: Target, count: matchesData.length },
    { id: "hired", label: "Hired", icon: UserCheck, count: hiredData.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Database className="size-6 text-primary" /> Master Database
        </h1>
        <p className="text-sm text-muted-foreground">Unified admin view of all system data</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search across records..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
              <t.icon className="size-3.5" /> {t.label}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{t.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="candidates">
          <Card><CardContent className="p-0">
            <DataTable isLoading={loadingC} data={filterFn(candidates, ["full_name", "email", "phone", "status"])} columns={[
              { key: "full_name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "status", label: "Status", render: (v) => <Badge variant="outline">{v}</Badge> },
              { key: "experience_years", label: "Exp (yrs)" },
              { key: "location", label: "Location" },
              { key: "source", label: "Source" },
            ]} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card><CardContent className="p-0">
            <DataTable isLoading={loadingJ} data={filterFn(jobs, ["title", "status", "location"])} columns={[
              { key: "title", label: "Title" },
              { key: "status", label: "Status", render: (v) => <Badge variant="outline">{v}</Badge> },
              { key: "priority", label: "Priority", render: (v) => <Badge variant="outline">{v}</Badge> },
              { key: "location", label: "Location" },
              { key: "openings", label: "Openings" },
              { key: "job_type", label: "Type" },
            ]} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card><CardContent className="p-0">
            <DataTable isLoading={loadingCo} data={filterFn(companies, ["name", "industry", "location"])} columns={[
              { key: "name", label: "Company" },
              { key: "industry", label: "Industry" },
              { key: "location", label: "Location" },
              { key: "website", label: "Website" },
              { key: "is_active", label: "Active", render: (v) => <Badge variant="outline">{v ? "Yes" : "No"}</Badge> },
            ]} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card><CardContent className="p-0">
            <DataTable isLoading={loadingM} data={filterFn(matchesData, ["status"]).map((m: any) => ({ ...m, candidate_name: m.candidate?.full_name, job_title: m.job?.title }))} columns={[
              { key: "candidate_name", label: "Candidate" },
              { key: "job_title", label: "Job" },
              { key: "overall_score", label: "Score", render: (v) => v != null ? `${v}%` : "—" },
              { key: "status", label: "Status", render: (v) => <Badge variant="outline">{v}</Badge> },
            ]} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="hired">
          <Card><CardContent className="p-0">
            <DataTable isLoading={loadingH} data={filterFn(hiredData, ["fee_status"]).map((h: any) => ({ ...h, candidate_name: h.candidate?.full_name, job_title: h.job?.title, company_name: h.company?.name }))} columns={[
              { key: "candidate_name", label: "Candidate" },
              { key: "job_title", label: "Job" },
              { key: "company_name", label: "Company" },
              { key: "offer_salary", label: "Salary", render: (v) => v ? `₹${v.toLocaleString()}` : "—" },
              { key: "placement_fee", label: "Fee", render: (v) => v ? `₹${v.toLocaleString()}` : "—" },
              { key: "fee_status", label: "Fee Status", render: (v) => <Badge variant="outline">{v || "pending"}</Badge> },
            ]} />
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
