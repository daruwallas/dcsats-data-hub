import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Globe, Mail, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["company-contacts", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_contacts").select("*").eq("company_id", id!).order("is_primary", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["company-jobs", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("id, title, status, priority").eq("company_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!company) return <div className="text-center py-12 text-muted-foreground">Company not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/companies")}><ArrowLeft className="size-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="size-6" />{company.name}</h1>
          {company.industry && <p className="text-muted-foreground">{company.industry}</p>}
        </div>
        <Badge variant={company.is_active ? "default" : "secondary"}>{company.is_active ? "Active" : "Inactive"}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {company.location && <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{company.location}</div>}
            {company.website && <div className="flex items-center gap-2"><Globe className="size-4 text-muted-foreground" /><a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{company.website}</a></div>}
            {company.address && <div className="text-muted-foreground">{company.address}</div>}
            {company.description && <div className="pt-2 border-t">{company.description}</div>}
            <div className="text-xs text-muted-foreground pt-2">Added: {format(new Date(company.created_at), "dd MMM yyyy")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contacts ({contacts.length})</CardTitle></CardHeader>
          <CardContent>
            {contacts.length === 0 ? <p className="text-sm text-muted-foreground">No contacts yet</p> : (
              <div className="space-y-3">
                {contacts.map(c => (
                  <div key={c.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{c.name}</span>
                      {c.is_primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                    </div>
                    {c.designation && <p className="text-xs text-muted-foreground">{c.designation}</p>}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {c.email && <span className="flex items-center gap-1"><Mail className="size-3" />{c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{c.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Jobs ({jobs.length})</CardTitle></CardHeader>
        <CardContent>
          {jobs.length === 0 ? <p className="text-sm text-muted-foreground">No jobs linked</p> : (
            <div className="space-y-2">
              {jobs.map(j => (
                <div key={j.id} className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/jobs/${j.id}`)}>
                  <span className="text-sm font-medium">{j.title}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{j.status}</Badge>
                    <Badge variant="outline">{j.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
