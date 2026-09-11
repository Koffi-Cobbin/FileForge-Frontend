import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Cloud, HardDrive, Zap, Upload, RefreshCw, Server, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { HealthStatus } from "@/lib/types";
import { PublicNav } from "@/components/public-nav";
import { useAuth } from "@/hooks/use-auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://fileforge1.pythonanywhere.com";

async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE_URL}/api/health/`);
  if (!res.ok) throw new Error("Failed to fetch provider status");
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

interface ProviderDetail {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  supportsDirectUpload: boolean;
  supportedTypes: string[];
  credentials: { field: string; description: string }[];
  notes: string[];
}

interface NavItem {
  id: string;
  label: string;
}

// ── Navigation ─────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How It Works" },
  { id: "cloudinary", label: "Cloudinary" },
  { id: "google-drive", label: "Google Drive" },
];

// ── Data ───────────────────────────────────────────────────────────────────

const PROVIDER_DETAILS: ProviderDetail[] = [
  {
    id: "cloudinary",
    name: "Cloudinary",
    tagline: "Media management & delivery",
    description:
      "Cloudinary is a cloud-based media platform optimised for images and videos. It handles upload, storage, transformation, and CDN delivery. FileForge uses the Cloudinary Upload API to store files and can return a permanent CDN URL once upload completes.",
    icon: Cloud,
    iconColor: "text-blue-500",
    supportsDirectUpload: true,
    supportedTypes: ["Images (JPEG, PNG, GIF, WebP, AVIF, …)", "Videos (MP4, MOV, AVI, …)", "Raw files (PDF, ZIP, CSV, …)"],
    credentials: [
      { field: "cloud_name", description: "Your Cloudinary cloud name, visible in the Cloudinary dashboard." },
      { field: "api_key", description: "API key from Cloudinary → Settings → API Keys." },
      { field: "api_secret", description: "API secret paired with your API key. Treat this like a password." },
    ],
    notes: [
      "Files are stored under your Cloudinary account and count toward your Cloudinary plan limits.",
      "Direct upload (large files) uses Cloudinary's signed upload flow — FileForge generates the signature server-side so your secret is never exposed.",
      "Returned URLs are permanent Cloudinary CDN links (res.cloudinary.com/…).",
    ],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    tagline: "Cloud file storage by Google",
    description:
      "Google Drive is Google's general-purpose file storage. FileForge integrates via OAuth 2.0, using a refresh token to upload files on behalf of a Google account without requiring interactive sign-in at upload time. Files are stored in your Drive and can optionally be organised into a specific folder.",
    icon: HardDrive,
    iconColor: "text-green-500",
    supportsDirectUpload: true,
    supportedTypes: ["Any file type (Drive stores files in their original format)"],
    credentials: [
      { field: "oauth2_client_id",     description: "The OAuth 2.0 Client ID from Google Cloud Console → APIs & Services → Credentials." },
      { field: "oauth2_client_secret", description: "The OAuth 2.0 Client Secret paired with your Client ID. Treat this like a password." },
      { field: "oauth2_refresh_token", description: "A long-lived refresh token obtained by completing the OAuth consent flow for your Google account. FileForge uses this to mint short-lived access tokens." },
      { field: "folder_id",            description: "(Optional) The ID of the Drive folder to upload into. Leave blank to upload to the root of the authorised account." },
    ],
    notes: [
      "Create an OAuth 2.0 Client ID of type 'Web application' or 'Desktop app' in Google Cloud Console and enable the Google Drive API.",
      "Complete the OAuth consent flow once to obtain a refresh token — tools like the OAuth Playground or a one-time local script can generate this for you.",
      "The refresh token grants Drive access to the authorised Google account; restrict the folder permissions if you want to limit scope.",
      "Storage counts against the Google Drive quota of the authorised account.",
    ],
  },
];

// ── Sidebar ────────────────────────────────────────────────────────────────

function ProvidersSidebar({ activeSection }: { activeSection: string }) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            activeSection === item.id
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatusDot({ active }: { active: boolean }) {
  return active ? (
    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
  ) : (
    <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
  );
}

function ProviderCard({ detail, active }: { detail: ProviderDetail; active: boolean | null }) {
  const Icon = detail.icon;
  return (
    <Card className={`border-border/60 ${active === false ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className={`h-5 w-5 ${detail.iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {detail.name}
                {active !== null && (
                  <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                    <StatusDot active={active} />
                    {active ? "Active" : "Not available"}
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{detail.tagline}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {detail.supportsDirectUpload && (
              <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-500/20 bg-blue-500/10">
                <Zap className="h-3 w-3" /> Direct upload
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{detail.description}</p>

        {/* Supported file types */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Supported types</h4>
          <ul className="space-y-1">
            {detail.supportedTypes.map((t) => (
              <li key={t} className="text-sm flex items-start gap-2">
                <Upload className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Required credentials */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Credentials</h4>
          <div className="divide-y divide-border/50 rounded-lg border border-border/60 overflow-hidden">
            {detail.credentials.map((c) => (
              <div key={c.field} className="flex items-start gap-3 px-4 py-3 bg-muted/10 text-sm">
                <code className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 shrink-0 mt-0.5">{c.field}</code>
                <span className="text-muted-foreground">{c.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</h4>
          <ul className="space-y-1.5">
            {detail.notes.map((n) => (
              <li key={n} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Providers() {
  const [location] = useLocation();
  const { data: health, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    staleTime: 60_000,
  });

  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoggedIn = !!profile;

  const activeProviders = health?.providers ?? null;

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Track scroll position to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS.map((item) => ({
        id: item.id,
        el: document.getElementById(item.id),
      }));

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.el) {
          const rect = section.el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const providersContent = (
    <div className="space-y-10 max-w-4xl">

          {/* Hero */}
          <section id="overview" className="scroll-mt-20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Server className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Storage providers FileForge can route your file uploads to.
                </p>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                {isFetching ? "Checking…" : "Refresh status"}
              </button>
            </div>

            {/* Status banners */}
            {isError && (
                <Card className="border-destructive/30 bg-destructive/5 mt-6">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-muted-foreground">
                      Could not reach the FileForge API to check live provider status. The details below are still accurate.
                    </p>
                  </CardContent>
                </Card>
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Checking live provider status…
                </div>
              )}

              {health && (
                <Card className="border-emerald-500/30 bg-emerald-500/5 mt-6">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">API is healthy.</span>{" "}
                      {activeProviders?.length
                        ? `${activeProviders.length} provider${activeProviders.length !== 1 ? "s" : ""} currently active: ${activeProviders.join(", ")}.`
                        : "No providers reported active."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* How providers work */}
            <section id="how-it-works" className="space-y-4 scroll-mt-20">
              <h2 className="text-xl font-bold border-b border-border pb-2">How Providers Work</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A provider is a third-party storage service that FileForge uploads files to on your behalf. You register credentials
                for a provider under each App, and FileForge uses those credentials when processing upload requests that specify
                that provider. Files are stored in <span className="font-medium text-foreground">your</span> provider account —
                FileForge never holds your files directly.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To use a provider, go to your App, open the <span className="font-medium text-foreground">Credentials</span> section,
                and add the required fields for that provider. You can register multiple providers per App and set one as the default.
              </p>
            </section>

            {/* Cloudinary */}
            <section id="cloudinary" className="scroll-mt-20">
              <ProviderCard
                detail={PROVIDER_DETAILS[0]}
                active={activeProviders === null ? null : activeProviders.includes("cloudinary")}
              />
            </section>

            {/* Google Drive */}
            <section id="google-drive" className="scroll-mt-20">
              <ProviderCard
                detail={PROVIDER_DETAILS[1]}
                active={activeProviders === null ? null : activeProviders.includes("google_drive")}
              />
            </section>

          </div>
  );

  if (isLoggedIn) {
    return providersContent;
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav extra={<Badge variant="outline" className="text-xs">Providers</Badge>} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-4">
          <ProvidersSidebar activeSection={activeSection} />
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button size="icon" className="rounded-full shadow-lg h-12 w-12">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold">Navigation</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ProvidersSidebar activeSection={activeSection} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 py-8 lg:pl-4">
          {providersContent}
        </main>
      </div>
    </div>
  );
}
