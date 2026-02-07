import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Target, CalendarDays, UserCheck, ShieldCheck, TrendingUp, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PIE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
  "hsl(199, 89%, 48%)",
  "hsl(346, 77%, 50%)",
  "hsl(45, 93%, 47%)",
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

  const stats = [
    { title: "Total Candidates", value: candidateCount, icon: Users, color: "text-blue-500", path: "/candidates" },
    { title: "Active Jobs", value: jobCount, icon: Briefcase, color: "text-green-500", path: "/jobs" },
    { title: "Matches", value: matchCount, icon: Target, color: "text-purple-500", path: "/matches" },
    { title: "Scheduled Interviews", value: interviewCount, icon: CalendarDays, color: "text-orange-500", path: "/calendar" },
    { title: "Hired", value: hiredCount, icon: UserCheck, color: "text-emerald-500", path: "/hired" },
    { title: "Pending Verifications", value: verificationCount, icon: ShieldCheck, color: "text-yellow-500", path: "/verifications" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {profile?.full_name || "User"}
        </h1>
        <p className="text-muted-foreground">Here&apos;s your recruitment overview</p>
      </div>

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
    </div>
  );
}
