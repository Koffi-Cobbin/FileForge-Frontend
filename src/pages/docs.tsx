import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { BookText, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PublicNav } from "@/components/public-nav";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";

// ── Types ──────────────────────────────────────────────────────────────────
type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

interface Endpoint {
  method: Method;
  path: string;
  description: string;
  note?: string;
  request?: string;
  response?: string;
}

interface NavItem {
  id: string;
  label: string;
}

// ── Navigation ─────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id: "authentication", label: "Authentication" },
  { id: "quickstart", label: "Quickstart" },
  { id: "storage-api", label: "Storage API" },
  { id: "folders", label: "Folders" },
  { id: "collections", label: "Collections" },
  { id: "file-status", label: "File Status" },
  { id: "http-status", label: "HTTP Status Codes" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const METHOD_STYLES: Record<Method, string> = {
  GET:    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  POST:   "bg-blue-500/10   text-blue-600   border-blue-500/20",
  PATCH:  "bg-amber-500/10  text-amber-600  border-amber-500/20",
  PUT:    "bg-orange-500/10 text-orange-600 border-orange-500/20",
  DELETE: "bg-red-500/10    text-red-600    border-red-500/20",
};

function MethodBadge({ method }: { method: Method }) {
  return (
    <Badge
      variant="outline"
      className={`font-mono text-xs px-2 py-0.5 shrink-0 ${METHOD_STYLES[method]}`}
    >
      {method}
    </Badge>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-md overflow-hidden border border-border/60">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border/60">
        <span className="text-xs text-muted-foreground font-mono">{label}</span>
        <button
          onClick={copy}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono overflow-x-auto bg-muted/20 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const hasDetails = !!(ep.note || ep.request || ep.response);
  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button
        onClick={() => hasDetails && setOpen((o) => !o)}
        className={`w-full text-left px-5 py-4 flex items-center gap-3 bg-card hover:bg-muted/30 transition-colors ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <MethodBadge method={ep.method} />
        <code className="text-sm font-mono font-semibold flex-1 text-foreground">{ep.path}</code>
        <span className="text-sm text-muted-foreground hidden sm:block">{ep.description}</span>
        {hasDetails && (
          <span className="text-muted-foreground text-xs ml-2">{open ? "▲" : "▼"}</span>
        )}
      </button>
      {!hasDetails && (
        <div className="px-5 pb-4 pt-0">
          <p className="text-sm text-muted-foreground sm:hidden">{ep.description}</p>
        </div>
      )}
      {hasDetails && open && (
        <div className="px-5 pb-5 pt-2 space-y-4 border-t border-border/40 bg-muted/10">
          <p className="text-sm text-muted-foreground sm:hidden">{ep.description}</p>
          {ep.note && (
            <div className="text-sm text-muted-foreground bg-muted/40 rounded-md px-4 py-3 border border-border/50">
              {ep.note}
            </div>
          )}
          {ep.request  && <CodeBlock label="Request"  code={ep.request}  />}
          {ep.response && <CodeBlock label="Response" code={ep.response} />}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pt-4">
      <h2 className="text-xl font-bold border-b border-border pb-2 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────

const STORAGE_ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/health/",
    description: "Liveness probe — no authentication required.",
    response: `{
  "status": "ok",
  "providers": ["cloudinary", "google_drive"]
}`,
  },
  {
    method: "GET",
    path: "/api/providers/",
    description: "List registered providers and their capabilities.",
    response: `{
  "providers": [
    {
      "name": "cloudinary",
      "supports_direct_upload": true,
      "supports_folders": true,
      "supports_collections": true
    },
    {
      "name": "google_drive",
      "supports_direct_upload": true,
      "supports_folders": true,
      "supports_collections": false
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/credentials/",
    description: "List provider credentials for the calling App.",
    response: `[
  {
    "id": 1,
    "owner": "app_xk3m9pq7rz1c",
    "provider": "cloudinary",
    "credentials": { "cloud_name": "my-cloud", "api_key": "123" },
    "is_default": true,
    "created_at": "2026-04-27T09:00:00Z",
    "updated_at": "2026-04-27T09:00:00Z"
  }
]`,
  },
  {
    method: "POST",
    path: "/api/credentials/",
    description: "Create or update (upsert) credentials for a provider.",
    request: `{
  "provider": "cloudinary",
  "credentials": {
    "cloud_name": "my-cloud",
    "api_key": "123456789",
    "api_secret": "secret"
  },
  "is_default": true
}`,
    response: `// 201 Created
{
  "id": 1,
  "owner": "app_xk3m9pq7rz1c",
  "provider": "cloudinary",
  "credentials": { ... },
  "is_default": true,
  "created_at": "2026-04-27T09:00:00Z",
  "updated_at": "2026-04-27T09:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/credentials/{id}/",
    description: "Get a single credential. Returns 404 if owned by a different App.",
  },
  {
    method: "PATCH",
    path: "/api/credentials/{id}/",
    description: "Partially update a credential (PATCH) or fully replace it (PUT).",
  },
  {
    method: "DELETE",
    path: "/api/credentials/{id}/",
    description: "Delete a credential record.",
    response: `// 204 No Content`,
  },
  {
    method: "GET",
    path: "/api/files/",
    description: "List files for the calling App. Filter with ?provider=cloudinary.",
    response: `[
  {
    "id": 42,
    "name": "photo.jpg",
    "size": 204800,
    "content_type": "image/jpeg",
    "provider": "cloudinary",
    "provider_file_id": "photo",
    "url": "https://res.cloudinary.com/my-cloud/image/upload/photo.jpg",
    "status": "completed",
    "error_message": "",
    "owner": "app_xk3m9pq7rz1c",
    "metadata": { "resource_type": "image", "bytes": 204800 },
    "upload_strategy": "async",
    "created_at": "2026-04-27T12:00:00Z",
    "updated_at": "2026-04-27T12:00:05Z"
  }
]`,
  },
  {
    method: "POST",
    path: "/api/files/",
    description: "Upload a file (≤ 5 MB default). Mode 'async' (default) returns 202 and queues upload; mode 'sync' blocks and returns 200 when done.",
    request: `# Upload to root (no folder)
curl -X POST http://localhost:5000/api/files/ \\
  -H "Authorization: Bearer ffk_YOUR_KEY" \\
  -F "file=@document.pdf" \\
  -F "provider=cloudinary" \\
  -F "name=document.pdf" \\
  -F "mode=async"

# Upload to a specific folder
curl -X POST http://localhost:5000/api/files/ \\
  -H "Authorization: Bearer ffk_YOUR_KEY" \\
  -F "file=@shoe-photo.jpg" \\
  -F "provider=cloudinary" \\
  -F "folder=products/shoes" \\
  -F "mode=async"

# Upload and add to a collection
curl -X POST http://localhost:5000/api/files/ \\
  -H "Authorization: Bearer ffk_YOUR_KEY" \\
  -F "file=@banner.png" \\
  -F "provider=cloudinary" \\
  -F "collection_id=12345" \\
  -F "mode=async"`,
    response: `// 202 Accepted (mode: "async", default)
{
  "id": 44,
  "name": "document.pdf",
  "size": 1048576,
  "content_type": "application/pdf",
  "provider": "cloudinary",
  "provider_file_id": null,
  "url": null,
  "status": "pending",
  "folder": "products/shoes",
  "collection_id": null,
  "error_message": "",
  "owner": "app_xk3m9pq7rz1c",
  "metadata": {},
  "upload_strategy": "async",
  "created_at": "2026-04-27T10:00:00Z",
  "updated_at": "2026-04-27T10:00:00Z"
}

// 200 OK (mode: "sync", upload succeeded)
{
  "id": 43,
  "name": "report.pdf",
  "status": "completed",
  "provider_file_id": "report",
  "url": "https://res.cloudinary.com/my-cloud/raw/upload/report.pdf",
  "upload_strategy": "sync",
  "folder": "products/shoes",
  "collection_id": 12345,
  ...
}

// 502 Bad Gateway (mode: "sync", provider upload failed)
{ "detail": "Cloudinary credentials invalid.", "file": { "id": 43, "status": "failed", ... } }`,
    note: `Fields: file (required), provider (required), name (optional), folder (optional), collection_id (optional), mode ("async" | "sync", default "async").
folder: Upload to a specific folder path (e.g., "products/shoes"). Creates the folder if it doesn't exist.
collection_id: Add the file to a collection after upload.
Async: poll GET /api/files/{id}/ until status is "completed" or "failed". On failure, read error_message.
Sync: blocks until the provider upload finishes — no polling needed. Returns 502 if the provider rejects the upload.`,
  },
  {
    method: "GET",
    path: "/api/files/{id}/",
    description: "Get a file record. Returns 404 if owned by a different App.",
    response: `// Status lifecycle:  pending → uploading → completed
//                                          ↘ failed

{
  "id": 44,
  "status": "completed",
  "provider_file_id": "document",
  "url": "https://res.cloudinary.com/my-cloud/raw/upload/document.pdf",
  ...
}`,
  },
  {
    method: "PATCH",
    path: "/api/files/{id}/",
    description: "Rename a file. Updates the name on the provider as well.",
    request: `{ "name": "new-name.pdf" }`,
  },
  {
    method: "DELETE",
    path: "/api/files/{id}/",
    description: "Delete the file record and the underlying object from the provider.",
    response: `// 204 No Content`,
  },
  {
    method: "POST",
    path: "/api/files/direct-upload/",
    description: "Initiate a direct upload for large files. Returns a pre-signed URL.",
    request: `{
  "name": "large-video.mp4",
  "provider": "cloudinary",
  "size": 52428800,
  "content_type": "video/mp4"
}

# Upload to a specific folder
{
  "name": "product-demo.mp4",
  "provider": "cloudinary",
  "size": 104857600,
  "content_type": "video/mp4",
  "folder": "products/videos"
}`,
    response: `// 201 Created
{
  "file_id": 44,
  "upload_url": "https://api.cloudinary.com/v1_1/my-cloud/video/upload",
  "method": "POST",
  "fields": {
    "timestamp": "1745744400",
    "public_id": "large-video",
    "api_key": "123456789",
    "signature": "abc123..."
  },
  "headers": {},
  "expires_in": null,
  "provider_ref": { "public_id": "large-video", "resource_type": "video" }
}`,
    note: "After receiving the ticket, upload directly to upload_url using the returned method and fields. Then call /direct-upload/complete/ to finalize. Use the folder parameter to upload to a specific folder path.",
  },
  {
    method: "POST",
    path: "/api/files/direct-upload/complete/",
    description: "Finalize a direct upload after the client has finished uploading.",
    request: `{
  "file_id": 44,
  "provider_file_id": "large-video",
  "provider_response": {
    "public_id": "large-video",
    "secure_url": "https://res.cloudinary.com/...",
    "resource_type": "video",
    "bytes": 52428800
  }
}`,
    response: `// 200 OK
{
  "id": 44,
  "status": "completed",
  "provider_file_id": "large-video",
  "url": "https://res.cloudinary.com/my-cloud/video/upload/large-video.mp4",
  "upload_strategy": "direct",
  ...
}`,
  },
];

// ── Folder Endpoints ──────────────────────────────────────────────────────

const FOLDER_ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/folders/",
    description: "List all folders for a provider. Only supported for providers with supports_folders=true.",
    note: "Query parameter: ?provider=cloudinary (required).",
    response: `// 200 OK
{
  "folders": [
    { "path": "products/shoes", "name": "shoes", "file_count": 12 },
    { "path": "products/videos", "name": "videos", "file_count": 5 },
    { "path": "banners", "name": "banners", "file_count": 3 }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/folders/",
    description: "Create a new folder. Only supported for providers with supports_folders=true.",
    request: `{
  "provider": "cloudinary",
  "path": "products/electronics"
}`,
    response: `// 201 Created
{
  "path": "products/electronics",
  "name": "electronics",
  "file_count": 0
}`,
  },
  {
    method: "DELETE",
    path: "/api/folders/{path}/",
    description: "Delete a folder and all its contents. Only supported for providers with supports_folders=true.",
    note: "⚠️ This action is irreversible. All files in the folder will be permanently deleted.",
    response: `// 204 No Content`,
  },
];

// ── Collection Endpoints ──────────────────────────────────────────────────

const COLLECTION_ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/collections/",
    description: "List all collections for a provider. Only supported for providers with supports_collections=true.",
    note: "Query parameter: ?provider=cloudinary (required).",
    response: `// 200 OK
{
  "collections": [
    { "id": "12345", "name": "Product Photos", "file_count": 25 },
    { "id": "67890", "name": "Marketing Banners", "file_count": 8 }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/collections/",
    description: "Create a new collection. Only supported for providers with supports_collections=true.",
    request: `{
  "provider": "cloudinary",
  "name": "Summer Campaign 2026"
}`,
    response: `// 201 Created
{
  "id": "abc123",
  "name": "Summer Campaign 2026",
  "file_count": 0
}`,
  },
  {
    method: "GET",
    path: "/api/collections/{id}/",
    description: "Get collection details and list of files in the collection.",
    response: `// 200 OK
{
  "id": "12345",
  "name": "Product Photos",
  "files": [
    { "id": 42, "name": "shoe-1.jpg", "url": "https://res.cloudinary.com/..." },
    { "id": 43, "name": "shoe-2.jpg", "url": "https://res.cloudinary.com/..." }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/collections/{id}/assets/",
    description: "Add a file to a collection.",
    request: `{
  "file_id": 44
}`,
    response: `// 200 OK
{
  "detail": "File added to collection successfully."
}`,
  },
  {
    method: "DELETE",
    path: "/api/collections/{id}/assets/",
    description: "Remove a file from a collection.",
    request: `{
  "file_id": 44
}`,
    response: `// 200 OK
{
  "detail": "File removed from collection successfully."
}`,
  },
];

// ── Sidebar Component ──────────────────────────────────────────────────────
function DocsSidebar({ activeSection }: { activeSection: string }) {
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

// ── Page ───────────────────────────────────────────────────────────────────
export default function Docs() {
  const [location] = useLocation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("authentication");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoggedIn = !!profile;

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

  const docsContent = (
    <div className="space-y-10 max-w-4xl">

          {/* Hero */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Integrate FileForge into your backend architecture.
            </p>
          </div>

            {/* Authentication */}
            <section id="authentication" className="space-y-4 scroll-mt-20">
              <SectionHeader
                title="Authentication"
                subtitle="FileForge uses API key authentication for all storage operations."
              />
              <p className="text-muted-foreground text-sm">
                FileForge exposes the storage API with API key authentication scheme.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="bg-muted/20 border-border/60">
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Storage</span>
                      <Badge variant="outline" className="text-xs font-mono">API Key</Badge>
                    </div>
                    <p className="text-sm font-semibold">Mounted at /api/</p>
                    <p className="text-xs text-muted-foreground">
                      Upload and manage files, configure provider credentials. Authenticated with a permanent API key.
                    </p>
                    <code className="block text-xs font-mono bg-muted/60 rounded px-3 py-2 mt-2">
                      Authorization: Bearer ffk_YOUR_API_KEY
                    </code>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Note:</span>{" "}
                    Never make storage API calls from a browser; always proxy through your own backend.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Quickstart */}
            <section id="quickstart" className="space-y-4 scroll-mt-20">
              <SectionHeader
                title="Quickstart"
                subtitle="Get from zero to your first file upload in five steps."
              />
              <div className="space-y-3">
                {[
                  {
                    n: "1",
                    label: "Create an account",
                    body: "Sign up to FileForge. Your developer account gives you access to the dashboard.",
                    code: null,
                  },
                  {
                    n: "2",
                    label: "Create an App",
                    body: "From the Apps page, create a new App. Each App gets a unique owner slug used to scope all its files.",
                    code: null,
                  },
                  {
                    n: "3",
                    label: "Generate an API key",
                    body: "Open your App and create an API key. Copy the raw key immediately — it is shown only once. This key is your authentication token for all Storage API requests, passed as Authorization: Bearer ffk_YOUR_KEY.",
                    code: null,
                  },
                  {
                    n: "4",
                    label: "Register provider credentials",
                    body: "Before uploading, tell FileForge which storage backend to use by posting your provider credentials. Set is_default: true to use this provider automatically.",
                    code: `POST /api/credentials/\nAuthorization: Bearer ffk_YOUR_KEY\nContent-Type: application/json\n\n{\n  "provider": "cloudinary",\n  "credentials": {\n    "cloud_name": "my-cloud",\n    "api_key": "123456789",\n    "api_secret": "my-secret"\n  },\n  "is_default": true\n}\n// → 201 Created`,
                  },
                  {
                    n: "5",
                    label: "Upload a file",
                    body: "Use your API key to call the Storage API from your backend. The provider you registered will be used to store the file.",
                    code: `POST /api/files/\nAuthorization: Bearer ffk_YOUR_KEY\n-F "file=@photo.jpg" -F "provider=cloudinary"\n// → 202 Accepted, status: "pending"`,
                  },
                ].map(({ n, label, body, code }) => (
                  <div key={n} className="flex gap-4">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {n}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">{body}</p>
                      {code && (
                        <pre className="text-xs font-mono bg-muted/30 border border-border/50 rounded-md px-3 py-2 overflow-x-auto leading-relaxed mt-1">
                          <code>{code}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Storage API */}
            <section id="storage-api" className="space-y-3 scroll-mt-20">
              <SectionHeader
                title="Storage API  /api/"
                subtitle="Authenticated with an API key. Use Authorization: Bearer ffk_YOUR_KEY. Owner is resolved automatically from the key — no extra header required."
              />
              {STORAGE_ENDPOINTS.map((ep) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />
              ))}
            </section>

            {/* Folders */}
            <section id="folders" className="space-y-4 scroll-mt-20">
              <SectionHeader
                title="Folders  /api/folders/"
                subtitle="Organise files into a folder hierarchy. Only available for providers that support folders (e.g., Cloudinary, Google Drive)."
              />
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Note:</span>{" "}
                    Folders are a provider-level concept. Not all providers support folders (check provider capabilities).
                    Cloudinary and Google Drive support folders. When you upload a file with a folder parameter,
                    the file is stored in that folder on the provider.
                  </p>
                </CardContent>
              </Card>

              {/* How to upload to a folder */}
              <Card className="border-border/60">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                    How to Upload a File to a Folder
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">folder</code> parameter to your upload request. The folder is created automatically if it doesn't exist.
                  </p>
                  <CodeBlock
                    label="Upload to a folder"
                    code={`POST /api/files/ HTTP/1.1
Authorization: Bearer ffk_YOUR_KEY
Content-Type: multipart/form-data; boundary=----Boundary

------Boundary
Content-Disposition: form-data; name="file"; filename="shoe-photo.jpg"
Content-Type: image/jpeg

<binary file data>
------Boundary
Content-Disposition: form-data; name="provider"

cloudinary
------Boundary
Content-Disposition: form-data; name="folder"

products/shoes
------Boundary--`}
                  />
                  <CodeBlock
                    label="Response"
                    code={`{
  "id": 44,
  "name": "shoe-photo.jpg",
  "status": "completed",
  "provider": "cloudinary",
  "folder": "products/shoes",
  "url": "https://res.cloudinary.com/my-cloud/image/upload/products/shoes/shoe-photo.jpg",
  ...
}`}
                  />
                </CardContent>
              </Card>

              {/* How to list folders */}
              <Card className="border-border/60">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                    How to List All Folders
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Retrieve all folders for a provider to see what folder structure exists.
                  </p>
                  <CodeBlock
                    label="Request"
                    code={`GET /api/folders/?provider=cloudinary HTTP/1.1
Authorization: Bearer ffk_YOUR_KEY`}
                  />
                  <CodeBlock
                    label="Response"
                    code={`{
  "folders": [
    { "path": "products/shoes", "name": "shoes", "file_count": 12 },
    { "path": "products/videos", "name": "videos", "file_count": 5 },
    { "path": "banners", "name": "banners", "file_count": 3 }
  ]
}`}
                  />
                </CardContent>
              </Card>

              {/* How to filter files by folder */}
              <Card className="border-border/60">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                    How to List Files in a Folder
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">folder</code> query parameter to filter files by folder path.
                  </p>
                  <CodeBlock
                    label="Request"
                    code={`GET /api/files/?provider=cloudinary&folder=products/shoes HTTP/1.1
Authorization: Bearer ffk_YOUR_KEY`}
                  />
                </CardContent>
              </Card>

              {FOLDER_ENDPOINTS.map((ep) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />
              ))}
            </section>

            {/* Collections */}
            <section id="collections" className="space-y-4 scroll-mt-20">
              <SectionHeader
                title="Collections  /api/collections/"
                subtitle="Group related files into collections. Only available for providers that support collections (e.g., Cloudinary)."
              />
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Note:</span>{" "}
                    Collections are virtual groupings — files remain in their original location but can be accessed
                    through the collection. Currently only Cloudinary supports collections.
                    Use collections to organise files for campaigns, projects, or any logical grouping.
                  </p>
                </CardContent>
              </Card>

              {/* How to create a collection */}
              <Card className="border-border/60">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                    How to Create a Collection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create a new collection to group related files together.
                  </p>
                  <CodeBlock
                    label="Request"
                    code={`POST /api/collections/ HTTP/1.1
Authorization: Bearer ffk_YOUR_KEY
Content-Type: application/json

{
  "provider": "cloudinary",
  "name": "Summer Campaign 2026"
}`}
                  />
                  <CodeBlock
                    label="Response"
                    code={`{
  "id": "abc123",
  "name": "Summer Campaign 2026",
  "file_count": 0
}`}
                  />
                </CardContent>
              </Card>

              {/* How to upload a file and add to collection */}
              <Card className="border-border/60">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                    How to Upload a File and Add to a Collection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">collection_id</code> parameter to your upload request to automatically add the file to a collection after upload.
                  </p>
                  <CodeBlock
                    label="Upload and add to collection"
                    code={`POST /api/files/ HTTP/1.1
Authorization: Bearer ffk_YOUR_KEY
Content-Type: multipart/form-data; boundary=----Boundary

------Boundary
Content-Disposition: form-data; name="file"; filename="banner.png"
Content-Type: image/png

<binary file data>
------Boundary
Content-Disposition: form-data; name="provider"

cloudinary
------Boundary
Content-Disposition: form-data; name="collection_id"

12345
------Boundary--`}
                  />
                  <CodeBlock
                    label="Response"
                    code={`{
  "id": 45,
  "name": "banner.png",
  "status": "completed",
  "provider": "cloudinary",
  "collection_id": 12345,
  "url": "https://res.cloudinary.com/my-cloud/image/upload/banner.png",
  ...
}`}
                  />
                </CardContent>
              </Card>

              {/* How to add existing file to collection */}
              <Card className="border-border/60">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                    How to Add an Existing File to a Collection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">POST /api/collections/{"{id}"}/assets/</code> endpoint to add an already uploaded file to a collection.
                  </p>
                  <CodeBlock
                    label="Request"
                    code={`POST /api/collections/12345/assets/ HTTP/1.1
Authorization: Bearer ffk_YOUR_KEY
Content-Type: application/json

{
  "file_id": 44
}`}
                  />
                  <CodeBlock
                    label="Response"
                    code={`{
  "detail": "File added to collection successfully."
}`}
                  />
                </CardContent>
              </Card>

              {/* How to list collection files */}
              <Card className="border-border/60">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
                    How to List Files in a Collection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Retrieve all files in a collection using the collection ID.
                  </p>
                  <CodeBlock
                    label="Request"
                    code={`GET /api/collections/12345/ HTTP/1.1
Authorization: Bearer ffk_YOUR_KEY`}
                  />
                  <CodeBlock
                    label="Response"
                    code={`{
  "id": "12345",
  "name": "Product Photos",
  "files": [
    { "id": 42, "name": "shoe-1.jpg", "url": "https://res.cloudinary.com/..." },
    { "id": 43, "name": "shoe-2.jpg", "url": "https://res.cloudinary.com/..." }
  ]
}`}
                  />
                </CardContent>
              </Card>

              {COLLECTION_ENDPOINTS.map((ep) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />
              ))}
            </section>

            {/* File Status */}
            <section id="file-status" className="space-y-4 scroll-mt-20">
              <SectionHeader
                title="File Status Lifecycle"
                subtitle="Files transition through states after upload."
              />
              <div className="flex flex-wrap items-center gap-3 text-sm font-mono">
                {(["pending", "uploading", "completed", "failed"] as const).map((s, i, arr) => {
                  const COLORS: Record<string, string> = {
                    pending:   "bg-yellow-500/10  text-yellow-600  border-yellow-500/20",
                    uploading: "bg-blue-500/10    text-blue-600    border-blue-500/20",
                    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    failed:    "bg-red-500/10     text-red-600     border-red-500/20",
                  };
                  const isLast = i === arr.length - 1;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <Badge variant="outline" className={`${COLORS[s]} px-3 py-1`}>{s}</Badge>
                      {!isLast && <span className="text-muted-foreground">{s === "uploading" ? "→ / →" : "→"}</span>}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                After a <code className="bg-muted px-1 rounded">202 Accepted</code>, poll{" "}
                <code className="bg-muted px-1 rounded">GET /api/files/{"{id}"}/</code> until{" "}
                <code className="bg-muted px-1 rounded">status</code> is{" "}
                <code className="bg-muted px-1 rounded">completed</code> or{" "}
                <code className="bg-muted px-1 rounded">failed</code>. On failure, read{" "}
                <code className="bg-muted px-1 rounded">error_message</code>.
              </p>
            </section>

            {/* HTTP Status Codes */}
            <section id="http-status" className="space-y-4 scroll-mt-20">
              <SectionHeader
                title="HTTP Status Codes"
                subtitle="Standard response codes used by the API."
              />
              <div className="divide-y divide-border/50 rounded-lg border border-border/60 overflow-hidden">
                {[
                  ["200", "OK",                       "Request succeeded."],
                  ["201", "Created",                  "Resource created."],
                  ["202", "Accepted",                 "File upload queued — poll for completion."],
                  ["204", "No Content",               "Delete succeeded."],
                  ["400", "Bad Request",              "Validation error or unsupported provider operation."],
                  ["401", "Unauthorized",             "Missing, invalid, revoked, or expired API key."],
                  ["403", "Forbidden",                "Valid auth but insufficient permissions for this resource."],
                  ["404", "Not Found",                "Resource not found or belongs to a different App."],
                  ["413", "Request Entity Too Large",  "File exceeds the upload size limit or sync threshold."],
                  ["502", "Bad Gateway",              "The underlying provider returned an error."],
                ].map(([code, name, desc], i) => (
                  <div key={code} className={`flex items-start gap-4 px-4 py-3 text-sm ${i % 2 === 0 ? "bg-muted/10" : "bg-card"}`}>
                    <code className={`shrink-0 font-mono font-bold w-10 ${
                      code.startsWith("2") ? "text-emerald-600" :
                      code.startsWith("4") ? "text-amber-600"   :
                      code.startsWith("5") ? "text-red-600"     : "text-foreground"
                    }`}>{code}</code>
                    <span className="font-medium w-40 shrink-0 text-foreground">{name}</span>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
  );

  if (isLoggedIn) {
    return <Layout>{docsContent}</Layout>;
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav extra={<Badge variant="outline" className="text-xs">Docs</Badge>} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-4">
          <DocsSidebar activeSection={activeSection} />
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
              <DocsSidebar activeSection={activeSection} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 py-8 lg:pl-4">
          {docsContent}
        </main>
      </div>
    </div>
  );
}
