import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, ListTodo, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const typeLabels: Record<string, string> = {
  general: "General",
  interview_docs: "Interview Docs",
  company_contacts: "Company Contacts",
  background_verification: "BG Verification",
};

export default function Todos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<any>(null);

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos", priorityFilter, typeFilter, showCompleted],
    queryFn: async () => {
      let q = supabase
        .from("todos")
        .select("*, candidates:related_candidate_id(full_name), companies:related_company_id(name), jobs:related_job_id(title)")
        .order("is_completed", { ascending: true })
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (!showCompleted) q = q.eq("is_completed", false);
      if (priorityFilter !== "all") q = q.eq("priority", priorityFilter as "low" | "medium" | "high" | "critical");
      if (typeFilter !== "all") q = q.eq("type", typeFilter as "general" | "interview_docs" | "company_contacts" | "background_verification");

      const { data } = await q;
      return data || [];
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await supabase.from("todos").update({
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const stats = {
    total: todos.length,
    completed: todos.filter((t: any) => t.is_completed).length,
    high: todos.filter((t: any) => !t.is_completed && (t.priority === "high" || t.priority === "critical")).length,
    overdue: todos.filter((t: any) => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Todos</h1>
          <p className="text-muted-foreground">Task management with checklists & priorities</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="size-4" /> Add Todo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard icon={ListTodo} label="Total" value={stats.total} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} className="text-green-600" />
        <StatCard icon={AlertTriangle} label="High Priority" value={stats.high} className="text-orange-600" />
        <StatCard icon={Clock} label="Overdue" value={stats.overdue} className="text-red-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="interview_docs">Interview Docs</SelectItem>
            <SelectItem value="company_contacts">Company Contacts</SelectItem>
            <SelectItem value="background_verification">BG Verification</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={showCompleted ? "default" : "outline"} size="sm" onClick={() => setShowCompleted(!showCompleted)}>
          {showCompleted ? "Hide Completed" : "Show Completed"}
        </Button>
      </div>

      {/* Todo List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : todos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No todos found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {todos.map((todo: any) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={(completed) => toggleComplete.mutate({ id: todo.id, completed })}
              onClick={() => setSelectedTodo(todo)}
            />
          ))}
        </div>
      )}

      <AddTodoDialog open={showAddDialog} onOpenChange={setShowAddDialog} userId={user?.id} />
      <TodoDetailDialog todo={selectedTodo} onClose={() => setSelectedTodo(null)} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, className = "" }: any) {
  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <Icon className={`size-5 ${className}`} />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TodoItem({ todo, onToggle, onClick }: { todo: any; onToggle: (v: boolean) => void; onClick: () => void }) {
  const isOverdue = !todo.is_completed && todo.due_date && new Date(todo.due_date) < new Date();

  return (
    <Card className={`cursor-pointer hover:shadow-sm transition-shadow ${todo.is_completed ? "opacity-60" : ""}`}>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={todo.is_completed}
            onCheckedChange={(v) => { v !== "indeterminate" && onToggle(v); }}
            className="mt-1"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1 min-w-0" onClick={onClick}>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-medium ${todo.is_completed ? "line-through" : ""}`}>{todo.title}</p>
              <Badge className={priorityColors[todo.priority] || ""}>{todo.priority}</Badge>
              <Badge variant="outline">{typeLabels[todo.type] || todo.type}</Badge>
            </div>
            {todo.description && <p className="text-sm text-muted-foreground mt-1 truncate">{todo.description}</p>}
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {todo.due_date && (
                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                  Due: {format(new Date(todo.due_date), "MMM d, yyyy")}
                </span>
              )}
              {todo.candidates?.full_name && <span>Candidate: {todo.candidates.full_name}</span>}
              {todo.jobs?.title && <span>Job: {todo.jobs.title}</span>}
              {todo.companies?.name && <span>Company: {todo.companies.name}</span>}
            </div>
          </div>
          {todo.checklist && Array.isArray(todo.checklist) && todo.checklist.length > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              {(todo.checklist as any[]).filter((c: any) => c.done).length}/{(todo.checklist as any[]).length}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddTodoDialog({ open, onOpenChange, userId }: { open: boolean; onOpenChange: (v: boolean) => void; userId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState("general");
  const [dueDate, setDueDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("todos").insert({
        title,
        description: description || null,
        priority: priority as any,
        type: type as any,
        due_date: dueDate || null,
        created_by: userId,
        assigned_to: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Todo created" });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      onOpenChange(false);
      setTitle(""); setDescription(""); setPriority("medium"); setType("general"); setDueDate("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Todo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="interview_docs">Interview Docs</SelectItem>
                  <SelectItem value="company_contacts">Company Contacts</SelectItem>
                  <SelectItem value="background_verification">BG Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Creating..." : "Create Todo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TodoDetailDialog({ todo, onClose }: { todo: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateChecklist = useMutation({
    mutationFn: async (checklist: any[]) => {
      await supabase.from("todos").update({ checklist }).eq("id", todo.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  if (!todo) return null;
  const checklist = Array.isArray(todo.checklist) ? todo.checklist : [];

  return (
    <Dialog open={!!todo} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{todo.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge className={priorityColors[todo.priority] || ""}>{todo.priority}</Badge>
            <Badge variant="outline">{typeLabels[todo.type] || todo.type}</Badge>
            {todo.is_completed && <Badge className="bg-green-100 text-green-700">Completed</Badge>}
          </div>
          {todo.description && <p className="text-sm text-muted-foreground">{todo.description}</p>}
          {todo.due_date && <p className="text-sm">Due: {format(new Date(todo.due_date), "MMM d, yyyy")}</p>}
          {todo.notes && (
            <div><p className="text-sm font-medium">Notes</p><p className="text-sm text-muted-foreground">{todo.notes}</p></div>
          )}
          {checklist.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Checklist ({checklist.filter((c: any) => c.done).length}/{checklist.length})</p>
              <div className="space-y-2">
                {checklist.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={(checked) => {
                        const updated = [...checklist];
                        updated[i] = { ...item, done: !!checked };
                        updateChecklist.mutate(updated);
                      }}
                    />
                    <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text || item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {todo.candidates?.full_name && <p className="text-sm">Candidate: {todo.candidates.full_name}</p>}
          {todo.jobs?.title && <p className="text-sm">Job: {todo.jobs.title}</p>}
          {todo.companies?.name && <p className="text-sm">Company: {todo.companies.name}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
