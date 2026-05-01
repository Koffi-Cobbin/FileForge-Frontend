import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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
    { "name": "cloudinary",   "supports_direct_upload": true },
    { "name": "google_drive", "supports_direct_upload": true }
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
    request: `# multipart/form-data
curl -X POST http://localhost:5000/api/files/ \\
  -H "Authorization: Bearer ffk_YOUR_KEY" \\
  -F "file=@document.pdf" \\
  -F "provider=cloudinary" \\
  -F "name=document.pdf" \\
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
  ...
}

// 502 Bad Gateway (mode: "sync", provider upload failed)
{ "detail": "Cloudinary credentials invalid.", "file": { "id": 43, "status": "failed", ... } }`,
    note: `Fields: file (required), provider (required), name (optional), mode ("async" | "sync", default "async").
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
    note: "After receiving the ticket, upload directly to upload_url using the returned method and fields. Then call /direct-upload/complete/ to finalize.",
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

// ── Page ───────────────────────────────────────────────────────────────────
export default function Docs() {
  return (
    <div className="space-y-10 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">API Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Integrate FileForge into your backend architecture.
        </p>
      </div>

      {/* Auth overview */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-2">Authentication Overview</h2>
        <p className="text-muted-foreground text-sm">
          FileForge exposes two API surfaces with separate authentication schemes.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="bg-muted/20 border-border/60">
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Management</span>
                <Badge variant="outline" className="text-xs font-mono">Console</Badge>
              </div>
              <p className="text-sm font-semibold">Handled by this dashboard</p>
              <p className="text-xs text-muted-foreground">
                Account registration, login, App creation, and API key management are all handled through this console — no direct API calls needed.
              </p>
            </CardContent>
          </Card>
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
              <span className="font-semibold text-foreground">Owner scoping is automatic.</span>{" "}
              When you authenticate with an API key the owner is resolved from the key's App — no extra header is needed.
              Never make storage API calls from a browser; always proxy through your own backend.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quickstart */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-2">Quickstart</h2>
        <p className="text-sm text-muted-foreground">
          Get from zero to your first file upload in four steps.
        </p>
        <div className="space-y-3">
          {[
            { n: "1", label: "Create an account",   body: "Sign up in this console. Your developer account gives you access to the dashboard.", code: null },
            { n: "2", label: "Create an App",        body: "From the Apps page, create a new App. Each App gets a unique owner slug used to scope all its files.", code: null },
            { n: "3", label: "Generate an API key",  body: "Open your App and create an API key. Copy the raw key immediately — it is shown only once.", code: null },
            { n: "4", label: "Upload a file",        body: "Use your API key to call the Storage API from your backend.", code: `POST /api/files/\nAuthorization: Bearer ffk_YOUR_KEY\n-F "file=@photo.jpg" -F "provider=cloudinary"\n// → 202 Accepted, status: "pending"` },
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
      </div>

      {/* Storage API */}
      <div className="space-y-3">
        <SectionHeader
          title="Storage API  /api/"
          subtitle="Authenticated with an API key. Use Authorization: Bearer ffk_YOUR_KEY. Owner is resolved automatically from the key — no extra header required."
        />
        {STORAGE_ENDPOINTS.map((ep) => (
          <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />
        ))}
      </div>

      {/* File status */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-2">File Status Lifecycle</h2>
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
      </div>

      {/* Error codes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-2">HTTP Status Codes</h2>
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
      </div>

    </div>
  );
}