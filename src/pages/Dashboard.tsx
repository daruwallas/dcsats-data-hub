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

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const { data: candidateCount = 0 } = useQuery({
    queryKey: ["dashboard-candidates"],
    queryFn: async () => {
      const { count } = await supabase.from("candidates").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: jobCount = 0 } = useQuery({
    queryKey: ["dashboard-jobs"],
    queryFn: async () => {
      const { count } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open");
      return count || 0;
    },
  });

  const { data: matchCount = 0 } = useQuery({
    queryKey: ["dashboard-matches"],
    queryFn: async () => {
      const { count } = await supabase.from("matches").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: interviewCount = 0 } = useQuery({
    queryKey: ["dashboard-interviews"],
    queryFn: async () => {
      const { count } = await supabase.from("interviews").select("*", { count: "exact", head: true }).eq("status", "scheduled");
      return count || 0;
    },
  });

  const { data: hiredCount = 0 } = useQuery({
    queryKey: ["dashboard-hired"],
    queryFn: async () => {
      const { count } = await supabase.from("hired_candidates").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: verificationCount = 0 } = useQuery({
    queryKey: ["dashboard-verifications"],
    queryFn: async () => {
      const { count } = await supabase.from("verifications").select("*", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
  });

  const { data: candidateStatuses = [] } = useQuery({
    queryKey: ["dashboard-candidate-statuses"],
    queryFn: async () => {
      const { data } = await supabase.from("candidates").select("status");
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name: name.replace("_", " "), value }));
    },
  });

  const { data: jobPriorities = [] } = useQuery({
    queryKey: ["dashboard-job-priorities"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("priority");
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(j => { counts[j.priority] = (counts[j.priority] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: recentActivity = [] } = useQuery({
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

  const { data: pipelineStats = { pending: 0, accepted: 0, rejected: 0 } } = useQuery({
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

  const stats = [
    { title: "Total Candidates", value: candidateCount, icon: Users, color: "text-blue-500", path: "/candidates" },
    { title: "Active Jobs", value: jobCount, icon: Briefcase, color: "text-green-500", path: "/jobs" },
    { title: "Matches", value: matchCount, icon: Target, color: "text-purple-500", path: "/matches" },
    { title: "Interviews", value: interviewCount, icon: CalendarDays, color: "text-orange-500", path: "/calendar" },
    { title: "Hired", value: hiredCount, icon: UserCheck, color: "text-emerald-500", path: "/hired" },
    { title: "Verifications", value: verificationCount, icon: ShieldCheck, color: "text-yellow-500", path: "/verifications" },
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
        {stats.map((stat) => (
          <Card key={stat.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(stat.path)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`size-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.label} variant="outline" size="sm" onClick={() => navigate(action.path)} className="gap-2">
                <action.icon className={`size-4 ${action.color}`} />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Candidate Pipeline</CardTitle></CardHeader>
          <CardContent>
            {candidateStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No candidate data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={candidateStatuses}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Job Priorities</CardTitle></CardHeader>
          <CardContent>
            {jobPriorities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No job data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={jobPriorities} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {jobPriorities.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Pipeline Stats + Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">HR Pipeline Stats</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-yellow-500">{pipelineStats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-500">{pipelineStats.accepted}</p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-red-500">{pipelineStats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/activity-logs")} className="text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <Activity className="size-4 text-muted-foreground mt-0.5 shrink-0" />
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
      </div>
    </div>
  );
}
