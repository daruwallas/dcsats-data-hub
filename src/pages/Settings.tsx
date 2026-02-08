import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, Bot, Mail, Shield, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface SettingValue {
  [key: string]: any;
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").order("key");
      return data || [];
    },
  });

  const settingsMap = Object.fromEntries(settings.map((s: any) => [s.key, s]));

  const upsertMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: Json; description?: string }) => {
      const existing = settingsMap[key];
      if (existing) {
        const { error } = await supabase.from("settings").update({ value, updated_at: new Date().toISOString() }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("settings").insert({ key, value, description });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">System configuration (Super Admin only)</p>
      </div>

      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai" className="gap-1.5"><Bot className="size-4" /> AI Config</TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5"><Mail className="size-4" /> Email/SMTP</TabsTrigger>
          <TabsTrigger value="verification" className="gap-1.5"><Shield className="size-4" /> Verification</TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5"><Settings2 className="size-4" /> General</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4 mt-4">
          <AISettings settingsMap={settingsMap} onSave={(key, value) => upsertMutation.mutate({ key, value, description: `AI config: ${key}` })} />
        </TabsContent>

        <TabsContent value="email" className="space-y-4 mt-4">
          <EmailSettings settingsMap={settingsMap} onSave={(key, value) => upsertMutation.mutate({ key, value, description: `Email config: ${key}` })} />
        </TabsContent>

        <TabsContent value="verification" className="space-y-4 mt-4">
          <VerificationSettings settingsMap={settingsMap} onSave={(key, value) => upsertMutation.mutate({ key, value, description: `Verification config: ${key}` })} />
        </TabsContent>

        <TabsContent value="general" className="space-y-4 mt-4">
          <GeneralSettings settingsMap={settingsMap} onSave={(key, value) => upsertMutation.mutate({ key, value, description: `General config: ${key}` })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AISettings({ settingsMap, onSave }: { settingsMap: Record<string, any>; onSave: (key: string, value: Json) => void }) {
  const current = (settingsMap["ai_config"]?.value || {}) as SettingValue;
  const [model, setModel] = useState(current.default_model || "gemini-2.5-flash");
  const [autoMatch, setAutoMatch] = useState(current.auto_match_on_create ?? true);
  const [matchThreshold, setMatchThreshold] = useState(current.match_threshold?.toString() || "60");

  useEffect(() => {
    const c = (settingsMap["ai_config"]?.value || {}) as SettingValue;
    setModel(c.default_model || "gemini-2.5-flash");
    setAutoMatch(c.auto_match_on_create ?? true);
    setMatchThreshold(c.match_threshold?.toString() || "60");
  }, [settingsMap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI Provider Configuration</CardTitle>
        <CardDescription>Configure AI models for CV parsing and matching</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Default AI Model</Label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gemini-2.5-flash" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-match on candidate create</Label>
            <p className="text-xs text-muted-foreground">Automatically run matching when a new candidate is added</p>
          </div>
          <Switch checked={autoMatch} onCheckedChange={setAutoMatch} />
        </div>
        <div className="space-y-2">
          <Label>Minimum Match Threshold (%)</Label>
          <Input type="number" min="0" max="100" value={matchThreshold} onChange={(e) => setMatchThreshold(e.target.value)} />
        </div>
        <Button onClick={() => onSave("ai_config", { default_model: model, auto_match_on_create: autoMatch, match_threshold: parseInt(matchThreshold) })}>
          Save AI Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function EmailSettings({ settingsMap, onSave }: { settingsMap: Record<string, any>; onSave: (key: string, value: Json) => void }) {
  const current = (settingsMap["smtp_config"]?.value || {}) as SettingValue;
  const [host, setHost] = useState(current.host || "");
  const [port, setPort] = useState(current.port?.toString() || "587");
  const [user, setUser] = useState(current.user || "");
  const [fromName, setFromName] = useState(current.from_name || "DCS ATS");
  const [fromEmail, setFromEmail] = useState(current.from_email || "");

  useEffect(() => {
    const c = (settingsMap["smtp_config"]?.value || {}) as SettingValue;
    setHost(c.host || ""); setPort(c.port?.toString() || "587");
    setUser(c.user || ""); setFromName(c.from_name || "DCS ATS"); setFromEmail(c.from_email || "");
  }, [settingsMap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SMTP Configuration</CardTitle>
        <CardDescription>Email delivery settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>SMTP Host</Label><Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" /></div>
          <div className="space-y-2"><Label>Port</Label><Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="587" /></div>
          <div className="space-y-2"><Label>Username</Label><Input value={user} onChange={(e) => setUser(e.target.value)} /></div>
          <div className="space-y-2"><Label>From Name</Label><Input value={fromName} onChange={(e) => setFromName(e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label>From Email</Label><Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} type="email" /></div>
        <Button onClick={() => onSave("smtp_config", { host, port: parseInt(port), user, from_name: fromName, from_email: fromEmail })}>
          Save Email Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function VerificationSettings({ settingsMap, onSave }: { settingsMap: Record<string, any>; onSave: (key: string, value: Json) => void }) {
  const current = (settingsMap["verification_config"]?.value || {}) as SettingValue;
  const [autoSendEmail, setAutoSendEmail] = useState(current.auto_send_email ?? false);
  const [reminderDays, setReminderDays] = useState(current.reminder_days?.toString() || "3");
  const [requireAll, setRequireAll] = useState(current.require_all_verifications ?? true);

  useEffect(() => {
    const c = (settingsMap["verification_config"]?.value || {}) as SettingValue;
    setAutoSendEmail(c.auto_send_email ?? false);
    setReminderDays(c.reminder_days?.toString() || "3");
    setRequireAll(c.require_all_verifications ?? true);
  }, [settingsMap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Verification Rules</CardTitle>
        <CardDescription>Background verification settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Label>Auto-send verification emails</Label><p className="text-xs text-muted-foreground">Automatically email company contacts</p></div>
          <Switch checked={autoSendEmail} onCheckedChange={setAutoSendEmail} />
        </div>
        <div className="space-y-2"><Label>Reminder interval (days)</Label><Input type="number" min="1" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} /></div>
        <div className="flex items-center justify-between">
          <div><Label>Require all verifications</Label><p className="text-xs text-muted-foreground">All past employers must be verified before hiring</p></div>
          <Switch checked={requireAll} onCheckedChange={setRequireAll} />
        </div>
        <Button onClick={() => onSave("verification_config", { auto_send_email: autoSendEmail, reminder_days: parseInt(reminderDays), require_all_verifications: requireAll })}>
          Save Verification Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function GeneralSettings({ settingsMap, onSave }: { settingsMap: Record<string, any>; onSave: (key: string, value: Json) => void }) {
  const current = (settingsMap["general_config"]?.value || {}) as SettingValue;
  const [companyName, setCompanyName] = useState(current.company_name || "Daruwallas Consultancy Services");
  const [idleTimeout, setIdleTimeout] = useState(current.idle_timeout_minutes?.toString() || "15");
  const [maxCandidatesPerJob, setMaxCandidatesPerJob] = useState(current.max_candidates_per_job?.toString() || "50");

  useEffect(() => {
    const c = (settingsMap["general_config"]?.value || {}) as SettingValue;
    setCompanyName(c.company_name || "Daruwallas Consultancy Services");
    setIdleTimeout(c.idle_timeout_minutes?.toString() || "15");
    setMaxCandidatesPerJob(c.max_candidates_per_job?.toString() || "50");
  }, [settingsMap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">General System Configuration</CardTitle>
        <CardDescription>Core application settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Idle Timeout (minutes)</Label><Input type="number" min="1" value={idleTimeout} onChange={(e) => setIdleTimeout(e.target.value)} /></div>
        <div className="space-y-2"><Label>Max Candidates per Job</Label><Input type="number" min="1" value={maxCandidatesPerJob} onChange={(e) => setMaxCandidatesPerJob(e.target.value)} /></div>
        <Button onClick={() => onSave("general_config", { company_name: companyName, idle_timeout_minutes: parseInt(idleTimeout), max_candidates_per_job: parseInt(maxCandidatesPerJob) })}>
          Save General Settings
        </Button>
      </CardContent>
    </Card>
  );
}
