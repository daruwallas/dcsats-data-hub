import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Upload, Briefcase, ArrowRight } from "lucide-react";
import dcsLogo from "@/assets/dcs-logo-clean.png";

export default function PortalHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <img src={dcsLogo} alt="DCS Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground">DCS ATS</h1>
            <p className="text-xs text-muted-foreground">Candidate Portal</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Welcome to DCS Recruitment</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            We connect top talent with the best opportunities. Submit your CV and let us find the perfect role for you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate("/submit-cv")}>
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Submit Your CV</h3>
              <p className="text-sm text-muted-foreground">
                Upload your resume and share your details. Our team will match you with suitable opportunities.
              </p>
              <Button variant="ghost" className="group-hover:text-primary">
                Get Started <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Active Opportunities</h3>
              <p className="text-sm text-muted-foreground">
                We work with leading companies across industries. New roles are added regularly.
              </p>
              <Button variant="ghost" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="inline-block">
            <CardContent className="p-6 flex items-center gap-4">
              <FileText className="size-8 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium text-sm">Already in our system?</p>
                <p className="text-xs text-muted-foreground">Check your email for onboarding or interview links from our team.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Daruwallas Consultancy Services. All rights reserved.</p>
      </footer>
    </div>
  );
}
