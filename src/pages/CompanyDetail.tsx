import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Globe, Mail, Phone, Building2, Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: contacts = [], refetch: refetchContacts } = useQuery({
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
        <EditCompanyDialog company={company} open={editOpen} onOpenChange={setEditOpen} onSaved={() => { qc.invalidateQueries({ queryKey: ["company", id] }); setEditOpen(false); }} />
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
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Contacts ({contacts.length})</CardTitle>
              <AddContactDialog companyId={id!} open={addContactOpen} onOpenChange={setAddContactOpen} onSaved={refetchContacts} />
            </div>
          </CardHeader>
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

function EditCompanyDialog({ company, open, onOpenChange, onSaved }: { company: any; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: company.name || "",
    industry: company.industry || "",
    location: company.location || "",
    website: company.website || "",
    address: company.address || "",
    description: company.description || "",
  });

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Error", description: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      name: form.name,
      industry: form.industry || null,
      location: form.location || null,
      website: form.website || null,
      address: form.address || null,
      description: form.description || null,
    }).eq("id", company.id);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Company updated!" });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Pencil className="size-4 mr-2" /> Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
          </div>
          <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} /></div>
          <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddContactDialog({ companyId, open, onOpenChange, onSaved }: { companyId: string; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", designation: "", email: "", phone: "", is_primary: false });

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Error", description: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("company_contacts").insert({
      company_id: companyId,
      name: form.name,
      designation: form.designation || null,
      email: form.email || null,
      phone: form.phone || null,
      is_primary: form.is_primary,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contact added!" });
    setForm({ name: "", designation: "", email: "", phone: "", is_primary: false });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="size-4 mr-2" /> Add Contact</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.is_primary} onCheckedChange={v => setForm(f => ({ ...f, is_primary: v as boolean }))} id="primary" />
            <Label htmlFor="primary">Primary Contact</Label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Add Contact"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
