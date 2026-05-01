import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import AppsList from "@/pages/apps";
import AppNew from "@/pages/app-new";
import AppDetail from "@/pages/app-detail";
import AppSettings from "@/pages/app-settings";
import Profile from "@/pages/profile";
import Docs from "@/pages/docs";
import Providers from "@/pages/providers";

import { AuthGuard, PublicGuard } from "@/components/auth-guard";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  return (
    <AuthGuard>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/apps" component={AppsList} />
          <Route path="/apps/new" component={AppNew} />
          <Route path="/apps/:id" component={AppDetail} />
          <Route path="/apps/:id/settings" component={AppSettings} />
          <Route path="/profile" component={Profile} />
          <Route path="/docs" component={Docs} />
          <Route path="/providers" component={Providers} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </AuthGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicGuard><Login /></PublicGuard>
      </Route>
      <Route path="/register">
        <PublicGuard><Register /></PublicGuard>
      </Route>
      <Route component={AuthenticatedApp} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="ff-theme">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
