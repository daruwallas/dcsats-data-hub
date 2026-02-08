import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Clock, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ProductivityCenter() {
  const [days, setDays] = useState("7");
  const since = startOfDay(subDays(new Date(), parseInt(days))).toISOString();

  const { data: logs = [] } = useQuery({
    queryKey: ["productivity-logs", days],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email");
      return data || [];
    },
  });

  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.user_id, p.full_name || p.email]));

  // Stats
  const totalActions = logs.length;
  const uniqueUsers = new Set(logs.map((l: any) => l.user_id)).size;

  // Actions by type
  const actionCounts: Record<string, number> = {};
  logs.forEach((l: any) => {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
  });
  const actionData = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Activity by user
  const userCounts: Record<string, number> = {};
  logs.forEach((l: any) => {
    const name = profileMap[l.user_id] || "Unknown";
    userCounts[name] = (userCounts[name] || 0) + 1;
  });
  const userData = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Daily activity
  const dailyCounts: Record<string, number> = {};
  logs.forEach((l: any) => {
    const day = format(new Date(l.created_at), "MMM dd");
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const dailyData = Object.entries(dailyCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productivity Center</h1>
          <p className="text-muted-foreground">Team activity tracking and reports</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24h</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="size-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalActions}</p>
                <p className="text-sm text-muted-foreground">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="size-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="size-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{actionData.length}</p>
                <p className="text-sm text-muted-foreground">Action Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="size-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{uniqueUsers > 0 ? Math.round(totalActions / uniqueUsers) : 0}</p>
                <p className="text-sm text-muted-foreground">Avg Actions/User</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Activity</CardTitle></CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No activity data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Actions by Type</CardTitle></CardHeader>
          <CardContent>
            {actionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={actionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {actionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity by User</CardTitle></CardHeader>
        <CardContent>
          {userData.length > 0 ? (
            <div className="space-y-3">
              {userData.map((u) => (
                <div key={u.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-40 truncate">{u.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${(u.value / (userData[0]?.value || 1)) * 100}%` }}
                    />
                  </div>
                  <Badge variant="secondary">{u.value}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No user activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
