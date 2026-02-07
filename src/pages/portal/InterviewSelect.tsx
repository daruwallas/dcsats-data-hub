import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CheckCircle, CalendarDays } from "lucide-react";
import dcsLogo from "@/assets/dcs-logo-clean.png";

// Placeholder - in production, slots would be fetched from the database
const mockSlots = [
  { id: "1", date: "Monday, 10 Feb 2026", time: "10:00 AM - 11:00 AM" },
  { id: "2", date: "Monday, 10 Feb 2026", time: "2:00 PM - 3:00 PM" },
  { id: "3", date: "Tuesday, 11 Feb 2026", time: "11:00 AM - 12:00 PM" },
  { id: "4", date: "Wednesday, 12 Feb 2026", time: "3:00 PM - 4:00 PM" },
];

export default function InterviewSelect() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get("candidate");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!candidateId) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Card><CardContent className="py-12 text-center text-muted-foreground">Invalid link.</CardContent></Card></div>;
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="size-16 mx-auto text-green-500" />
            <h2 className="text-xl font-bold">Interview Confirmed!</h2>
            <p className="text-muted-foreground text-sm">Your preferred time slot has been submitted. We&apos;ll send you a confirmation email shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src={dcsLogo} alt="DCS Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground">DCS ATS</h1>
            <p className="text-xs text-muted-foreground">Select Interview Time</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold">Select Your Preferred Time</h2>
          <p className="text-sm text-muted-foreground">Choose a slot that works best for you</p>
        </div>

        <div className="space-y-3">
          {mockSlots.map(slot => (
            <Card
              key={slot.id}
              className={`cursor-pointer transition-all ${selected === slot.id ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"}`}
              onClick={() => setSelected(slot.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <CalendarDays className="size-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{slot.date}</p>
                  <p className="text-sm text-muted-foreground">{slot.time}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === slot.id ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                  {selected === slot.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" disabled={!selected} onClick={() => setConfirmed(true)}>
          Confirm Selection
        </Button>
      </div>
    </div>
  );
}
