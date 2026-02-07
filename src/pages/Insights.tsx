import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Briefcase, Target, UserCheck, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function Insights() {
  const { data: candidates = [] } = useQuery({
    queryKey: ["insights-candidates"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("status, source, created_at, experience_years, location");
      return data || [];
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["insights-jobs"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("status, priority, created_at");
      return data || [];
    },
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["insights-matches"],
    queryFn: async () => {
      const { data } = await supabase.from("matches").select("status, overall_score, created_at");
      return data || [];
    },
  });

  const { data: hired = [] } = useQuery({
    queryKey: ["insights-hired"],
    queryFn: async () => {
      const { data } = await supabase.from("hired_candidates").select("offer_salary, placement_fee, created_at");
      return data || [];
    },
  });

  // Candidate status distribution
  const statusCounts = candidates.reduce((acc: Record<string, number>, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Source distribution
  const sourceCounts = candidates.reduce((acc: Record<string, number>, c: any) => {
    const src = c.source || "Unknown";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

  // Job status distribution
  const jobStatusCounts = jobs.reduce((acc: Record<string, number>, j: any) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
  const jobStatusData = Object.entries(jobStatusCounts).map(([name, value]) => ({ name, value }));

  // Monthly hiring trend
  const monthlyHired = hired.reduce((acc: Record<string, number>, h: any) => {
    const month = h.created_at?.substring(0, 7) || "Unknown";
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const hiringTrend = Object.entries(monthlyHired).sort().map(([month, count]) => ({ month, count }));

  // Match score distribution
  const scoreRanges = [
    { range: "0-20", min: 0, max: 20 },
    { range: "21-40", min: 21, max: 40 },
    { range: "41-60", min: 41, max: 60 },
    { range: "61-80", min: 61, max: 80 },
    { range: "81-100", min: 81, max: 100 },
  ];
  const scoreData = scoreRanges.map(({ range, min, max }) => ({
    range,
    count: matches.filter((m: any) => m.overall_score >= min && m.overall_score <= max).length,
  }));

  const totalRevenue = hired.reduce((s: number, h: any) => s + (h.placement_fee || 0), 0);
  const avgScore = matches.length ? Math.round(matches.reduce((s: number, m: any) => s + (m.overall_score || 0), 0) / matches.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="size-6 text-primary" /> Insights
        </h1>
        <p className="text-sm text-muted-foreground">Advanced analytics across all ATS data</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Candidates", value: candidates.length, icon: Users },
          { label: "Active Jobs", value: jobs.filter((j: any) => j.status === "open").length, icon: Briefcase },
          { label: "Total Matches", value: matches.length, icon: Target },
          { label: "Avg Match Score", value: `${avgScore}%`, icon: TrendingUp },
          { label: "Hired", value: hired.length, icon: UserCheck },
          { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: BarChart3 },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-4 text-center">
              <kpi.icon className="size-5 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Candidate Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Candidate Sources</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Match Score Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Hiring Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              {hiringTrend.length > 0 ? (
                <LineChart data={hiringTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No hiring data yet</div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Job Status Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={jobStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {jobStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
