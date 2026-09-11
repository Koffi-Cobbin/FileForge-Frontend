import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import { useEffect } from "react";

const FEATURES = [
  {
    title: "Multi-Provider Storage",
    description: "Upload files to Cloudinary, Google Drive, or any supported provider — all through a single API.",
  },
  {
    title: "API Key Authentication",
    description: "Generate permanent API keys for each App. No OAuth flows, no expiring tokens.",
  },
  {
    title: "Direct Uploads",
    description: "Support for large files via pre-signed URLs. Bypass server limits for big uploads.",
  },
  {
    title: "Simple Pricing",
    description: "Free tier included. Pay only for the storage you use.",
  },
];

export default function Landing() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <Badge variant="outline" className="mb-4 text-xs">Developer Console</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          File storage, simplified.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          FileForge is a developer-first file storage service. Upload, manage, and serve files
          through a clean REST API — with support for multiple cloud providers out of the box.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg">Get started free</Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="lg">Read the docs</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="bg-muted/20 border-border/60">
              <CardContent className="pt-5">
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>FileForge</span>
          <span>Build fast. Ship files.</span>
        </div>
      </footer>
    </div>
  );
}
