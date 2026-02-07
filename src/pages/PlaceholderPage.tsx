import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.slice(1).replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center space-y-4">
          <Construction className="size-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">{pageName}</h2>
          <p className="text-muted-foreground text-sm">This page is coming soon. It will be built in an upcoming phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
