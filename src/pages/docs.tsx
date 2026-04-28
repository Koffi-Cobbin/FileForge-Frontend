import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Docs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">API Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Integrate FileForge into your backend architecture.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Authentication</h2>
        <p className="text-muted-foreground">
          All API requests to the storage engine require an API key passed in the <code className="text-sm bg-muted px-1.5 py-0.5 rounded text-foreground">Authorization</code> header.
          You also must pass your application's public identifier in the <code className="text-sm bg-muted px-1.5 py-0.5 rounded text-foreground">X-FileForge-App</code> header.
        </p>
        <Card className="bg-muted/30">
          <CardContent className="pt-6 font-mono text-sm space-y-2 overflow-x-auto">
            <div>Authorization: Bearer ffk_YOUR_API_KEY</div>
            <div>X-FileForge-App: your_owner_slug</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Endpoints</h2>

        {/* Health */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 font-mono text-sm">GET</Badge>
            <h3 className="text-lg font-bold font-mono">/api/health/</h3>
          </div>
          <p className="text-muted-foreground">Check the operational status of the FileForge engine and connected providers. No authentication required.</p>
          <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
            <div className="text-muted-foreground mb-2">// Response</div>
            <pre><code>{`{
  "status": "ok",
  "providers": {
    "cloudinary": "connected",
    "gdrive": "disconnected"
  }
}`}</code></pre>
          </div>
        </section>

        {/* Async Upload */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono text-sm">POST</Badge>
            <h3 className="text-lg font-bold font-mono">/api/files/</h3>
          </div>
          <p className="text-muted-foreground">
            Initiate a file upload. This returns a secure upload URL or instructions on how to stream the payload depending on the configured backend provider.
          </p>
          <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto space-y-4">
            <div>
              <div className="text-muted-foreground mb-2">// Request Body</div>
              <pre><code>{`{
  "filename": "document.pdf",
  "size": 1048576,
  "mime_type": "application/pdf"
}`}</code></pre>
            </div>
            <div>
              <div className="text-muted-foreground mb-2">// Response</div>
              <pre><code>{`{
  "id": "file_8x9a...",
  "status": "pending",
  "upload_url": "https://...",
  "expires_at": "2025-01-01T12:00:00Z"
}`}</code></pre>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
