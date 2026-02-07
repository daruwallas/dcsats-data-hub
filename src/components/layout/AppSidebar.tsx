import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  Target,
  CalendarDays,
  ListTodo,
  Mail,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  BarChart3,
  UserCheck,
  Database,
  Activity,
  Settings,
  Zap,
  FileSearch,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTodoGuard } from "@/components/TodoGuard";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import dcsLogo from "@/assets/dcs-logo-clean.png";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  minRole?: "recruiter" | "hr_manager" | "admin" | "super_admin";
}

const mainNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Candidates", url: "/candidates", icon: Users },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Companies", url: "/companies", icon: Building2 },
];

const matchingNav: NavItem[] = [
  { title: "Power Match", url: "/matches", icon: Target },
  { title: "Match Resumes", url: "/match-resumes", icon: FileSearch },
  { title: "Reverse Match", url: "/reverse-match", icon: Zap },
];

const workflowNav: NavItem[] = [
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Todos", url: "/todos", icon: ListTodo },
  { title: "Emails", url: "/emails", icon: Mail, minRole: "hr_manager" },
  { title: "Verifications", url: "/verifications", icon: ShieldCheck },
  { title: "HR Pipeline", url: "/hr-pipeline", icon: TrendingUp },
];

const advancedNav: NavItem[] = [
  { title: "Deal Closer", url: "/deal-closer", icon: Briefcase },
  { title: "Money Alerts", url: "/money-alerts", icon: DollarSign, minRole: "hr_manager" },
  { title: "Insights", url: "/insights", icon: BarChart3 },
  { title: "Hired", url: "/hired", icon: UserCheck },
];

const adminNav: NavItem[] = [
  { title: "Master DB", url: "/master-db", icon: Database, minRole: "admin" },
  { title: "Productivity", url: "/productivity", icon: Activity, minRole: "admin" },
  { title: "Activity Logs", url: "/activity-logs", icon: Activity, minRole: "admin" },
  { title: "Users", url: "/users", icon: Users, minRole: "admin" },
  { title: "Settings", url: "/settings", icon: Settings, minRole: "super_admin" },
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasMinRole } = useAuth();
  const { requestNavigation } = useTodoGuard();

  const visibleItems = items.filter(
    (item) => !item.minRole || hasMinRole(item.minRole)
  );

  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const active = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={active}
                  onClick={() => requestNavigation(() => navigate(item.url))}
                  tooltip={item.title}
                  className={
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary rounded-none rounded-r-md"
                      : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                  }
                >
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { profile } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <img src={dcsLogo} alt="DCS Logo" className="size-8 rounded-lg object-contain" />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">DCS ATS</span>
            <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Recruitment Suite</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="bg-sidebar-border" />
      <SidebarContent className="scrollbar-thin">
        <NavGroup label="Main" items={mainNav} />
        <NavGroup label="Matching" items={matchingNav} />
        <NavGroup label="Workflows" items={workflowNav} />
        <NavGroup label="Advanced" items={advancedNav} />
        <NavGroup label="Admin" items={adminNav} />
      </SidebarContent>
      <SidebarSeparator className="bg-sidebar-border" />
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar className="size-7 border border-sidebar-border">
            <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium text-sidebar-accent-foreground truncate max-w-[140px]">
              {profile?.full_name || "User"}
            </span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate max-w-[140px]">
              {profile?.email || ""}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
