import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Target, CalendarDays } from "lucide-react";

export default function Dashboard() {
  const { profile } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const stats = [
    { title: "Total Candidates", value: "0", icon: Users, color: "text-blue-500" },
    { title: "Active Jobs", value: "0", icon: Briefcase, color: "text-green-500" },
    { title: "Matches", value: "0", icon: Target, color: "text-purple-500" },
    { title: "Interviews", value: "0", icon: CalendarDays, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {profile?.full_name || "User"}
        </h1>
        <p className="text-muted-foreground">Here&apos;s your recruitment overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`size-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
