import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  no_show: "bg-yellow-500",
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ["calendar-interviews", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      const { data } = await supabase
        .from("interviews")
        .select("*, candidates(full_name), jobs(title, companies(name))")
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .order("scheduled_at");
      return data || [];
    },
  });

  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const interviewsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    interviews.forEach((iv: any) => {
      const key = format(new Date(iv.scheduled_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(iv);
    });
    return map;
  }, [interviews]);

  const selectedDayInterviews = selectedDate
    ? interviewsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((i: any) => i.status === "scheduled").length,
    completed: interviews.filter((i: any) => i.status === "completed").length,
    cancelled: interviews.filter((i: any) => i.status === "cancelled" || i.status === "no_show").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">Interview schedule overview</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card><CardContent className="py-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">This Month</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p><p className="text-xs text-muted-foreground">Scheduled</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-2xl font-bold text-green-600">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-2xl font-bold text-red-600">{stats.cancelled}</p><p className="text-xs text-muted-foreground">Cancelled/No Show</p></CardContent></Card>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px">
                {calendarDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayInterviews = interviewsByDate[key] || [];
                  const inMonth = isSameMonth(day, currentMonth);

                  return (
                    <div
                      key={key}
                      className={`min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                        ${!inMonth ? "bg-muted/30 text-muted-foreground" : "hover:bg-accent/50"}
                        ${isToday(day) ? "border-primary" : "border-border"}
                        ${selectedDate && isSameDay(day, selectedDate) ? "bg-accent" : ""}
                      `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : ""}`}>
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayInterviews.slice(0, 2).map((iv: any) => (
                          <div
                            key={iv.id}
                            className="text-[10px] leading-tight truncate px-1 py-0.5 rounded bg-primary/10 text-primary cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setSelectedInterview(iv); }}
                          >
                            {format(new Date(iv.scheduled_at), "HH:mm")} {iv.candidates?.full_name?.split(" ")[0]}
                          </div>
                        ))}
                        {dayInterviews.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{dayInterviews.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Panel */}
      {selectedDate && selectedDayInterviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{format(selectedDate, "EEEE, MMMM d, yyyy")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selectedDayInterviews.map((iv: any) => (
              <div
                key={iv.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50"
                onClick={() => setSelectedInterview(iv)}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[iv.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{iv.candidates?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{iv.jobs?.title} — {iv.jobs?.companies?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{format(new Date(iv.scheduled_at), "HH:mm")}</p>
                  <Badge variant="outline" className="text-[10px]">{iv.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Interview Detail Dialog */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Interview Details</DialogTitle></DialogHeader>
          {selectedInterview && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Candidate</p>
                <p className="font-medium">{selectedInterview.candidates?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Job</p>
                <p className="font-medium">{selectedInterview.jobs?.title} — {selectedInterview.jobs?.companies?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{format(new Date(selectedInterview.scheduled_at), "MMM d, yyyy HH:mm")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedInterview.duration_minutes || 60} min</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedInterview.interview_type?.replace("_", " ") || "In Person"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline">{selectedInterview.status}</Badge>
                </div>
              </div>
              {selectedInterview.location && (
                <div><p className="text-sm text-muted-foreground">Location</p><p className="font-medium">{selectedInterview.location}</p></div>
              )}
              {selectedInterview.meeting_link && (
                <div><p className="text-sm text-muted-foreground">Meeting Link</p><a href={selectedInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">{selectedInterview.meeting_link}</a></div>
              )}
              {selectedInterview.interviewers?.length > 0 && (
                <div><p className="text-sm text-muted-foreground">Interviewers</p><p className="font-medium">{selectedInterview.interviewers.join(", ")}</p></div>
              )}
              {selectedInterview.notes && (
                <div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm">{selectedInterview.notes}</p></div>
              )}
              {selectedInterview.feedback && (
                <div><p className="text-sm text-muted-foreground">Feedback</p><p className="text-sm">{selectedInterview.feedback}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
