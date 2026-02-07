import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Briefcase, Target, CalendarDays, UserCheck, ShieldCheck,
  Plus, FileSearch, Zap, Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";

const PIE_COLORS = [
  "hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)", "hsl(0, 84%, 60%)", "hsl(199, 89%, 48%)",
  "hsl(346, 77%, 50%)", "hsl(45, 93%, 47%)",
];

/* ── Hooks ─────────────────────────────────────────── */

function useDashboardData() {
  const candidateCount = useQuery({
    queryKey: ["dashboard-candidates"],
    queryFn: async () => {
      const { count } = await supabase.from("candidates").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const jobCount = useQuery({
    queryKey: ["dashboard-jobs"],
    queryFn: async () => {
      const { count } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open");
      return count || 0;
    },
  });

  const matchCount = useQuery({
    queryKey: ["dashboard-matches"],
    queryFn: async () => {
      const { count } = await supabase.from("matches").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const interviewCount = useQuery({
    queryKey: ["dashboard-interviews"],
    queryFn: async () => {
      const { count } = await supabase.from("interviews").select("*", { count: "exact", head: true }).eq("status", "scheduled");
      return count || 0;
    },
  });

  const hiredCount = useQuery({
    queryKey: ["dashboard-hired"],
    queryFn: async () => {
      const { count } = await supabase.from("hired_candidates").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const verificationCount = useQuery({
    queryKey: ["dashboard-verifications"],
    queryFn: async () => {
      const { count } = await supabase.from("verifications").select("*", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
  });

  const candidateStatuses = useQuery({
    queryKey: ["dashboard-candidate-statuses"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("status");
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name: name.replace("_", " "), value }));
    },
  });

  const jobPriorities = useQuery({
    queryKey: ["dashboard-job-priorities"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("priority");
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(j => { counts[j.priority] = (counts[j.priority] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const recentActivity = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("id, action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const pipelineStats = useQuery({
    queryKey: ["dashboard-pipeline"],
    queryFn: async () => {
      const { data } = await supabase.from("hr_pipeline").select("status");
      if (!data) return { pending: 0, accepted: 0, rejected: 0 };
      const stats = { pending: 0, accepted: 0, rejected: 0 };
      data.forEach(p => {
        if (p.status === "pending" || p.status === "sent") stats.pending++;
        else if (p.status === "accepted") stats.accepted++;
        else if (p.status === "rejected") stats.rejected++;
      });
      return stats;
    },
  });

  return {
    candidateCount: candidateCount.data ?? 0,
    jobCount: jobCount.data ?? 0,
    matchCount: matchCount.data ?? 0,
    interviewCount: interviewCount.data ?? 0,
    hiredCount: hiredCount.data ?? 0,
    verificationCount: verificationCount.data ?? 0,
    candidateStatuses: candidateStatuses.data ?? [],
    jobPriorities: jobPriorities.data ?? [],
    recentActivity: recentActivity.data ?? [],
    pipelineStats: pipelineStats.data ?? { pending: 0, accepted: 0, rejected: 0 },
  };
}

/* ── Sub-components ────────────────────────────────── */

function StatCard({ title, value, icon: Icon, color, onClick, delay }: {
  title: string; value: number; icon: React.ElementType; color: string; onClick: () => void; delay: number;
}) {
  return (
    <Card
      className="cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-200 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg p-1.5 ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`size-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function QuickActions({ actions }: { actions: { label: string; icon: React.ElementType; path: string; color: string }[] }) {
  const navigate = useNavigate();
  return (
    <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => navigate(action.path)}
              className="gap-2 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <action.icon className={`size-4 ${action.color}`} />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CandidatePipelineChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
      <CardHeader><CardTitle className="text-base">Candidate Pipeline</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No candidate data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function JobPrioritiesChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "500ms" }}>
      <CardHeader><CardTitle className="text-base">Job Priorities</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No job data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineStatsCard({ stats }: { stats: { pending: number; accepted: number; rejected: number } }) {
  return (
    <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "600ms" }}>
      <CardHeader><CardTitle className="text-base">HR Pipeline Stats</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { value: stats.pending, label: "Pending", color: "text-yellow-500" },
            { value: stats.accepted, label: "Accepted", color: "text-green-500" },
            { value: stats.rejected, label: "Rejected", color: "text-red-500" },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({ logs }: { logs: { id: string; action: string; entity_type: string | null; created_at: string }[] }) {
  const navigate = useNavigate();
  return (
    <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "700ms" }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/activity-logs")} className="text-xs">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm group hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors duration-150">
                <Activity className="size-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors duration-150" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.entity_type && <span className="capitalize">{log.entity_type} · </span>}
                    {format(new Date(log.created_at), "dd MMM, hh:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main Dashboard ────────────────────────────────── */

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const data = useDashboardData();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const stats = [
    { title: "Total Candidates", value: data.candidateCount, icon: Users, color: "text-blue-500", path: "/candidates" },
    { title: "Active Jobs", value: data.jobCount, icon: Briefcase, color: "text-green-500", path: "/jobs" },
    { title: "Matches", value: data.matchCount, icon: Target, color: "text-purple-500", path: "/matches" },
    { title: "Interviews", value: data.interviewCount, icon: CalendarDays, color: "text-orange-500", path: "/calendar" },
    { title: "Hired", value: data.hiredCount, icon: UserCheck, color: "text-emerald-500", path: "/hired" },
    { title: "Verifications", value: data.verificationCount, icon: ShieldCheck, color: "text-yellow-500", path: "/verifications" },
  ];

  const quickActions = [
    { label: "Add Candidate", icon: Plus, path: "/candidates", color: "text-blue-500" },
    { label: "Add Job", icon: Plus, path: "/jobs", color: "text-green-500" },
    { label: "Power Match", icon: Target, path: "/matches", color: "text-purple-500" },
    { label: "Match Resumes", icon: FileSearch, path: "/match-resumes", color: "text-orange-500" },
    { label: "Reverse Match", icon: Zap, path: "/reverse-match", color: "text-pink-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}, {profile?.full_name || "User"}
          </h1>
          <p className="text-muted-foreground">Here&apos;s your recruitment overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} delay={i * 60} onClick={() => navigate(stat.path)} />
        ))}
      </div>

      <QuickActions actions={quickActions} />

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <CandidatePipelineChart data={data.candidateStatuses} />
        <JobPrioritiesChart data={data.jobPriorities} />
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2">
        <PipelineStatsCard stats={data.pipelineStats} />
        <RecentActivityCard logs={data.recentActivity} />
      </div>
    </div>
  );
}
