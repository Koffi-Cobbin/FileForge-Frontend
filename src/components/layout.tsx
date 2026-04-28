import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { 
  LogOut, 
  User, 
  Moon, 
  Sun, 
  LayoutDashboard, 
  Box, 
  BookText, 
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { profile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/apps", label: "Apps", icon: Box },
    { href: "/docs", label: "Docs", icon: BookText },
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const NavLinks = () => (
    <>
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
          FF
        </div>
        <span className="text-xl font-bold font-mono tracking-tight">FileForge</span>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              location === item.href || (item.href !== "/" && location.startsWith(item.href))
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card px-4 py-6">
        <NavLinks />
        
        <div className="mt-auto border-t pt-4 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors truncate">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <User className="h-4 w-4" />
            </div>
            <span className="truncate">{profile?.email || "User"}</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="shrink-0 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-6 flex flex-col">
                <NavLinks />
                <div className="mt-auto border-t pt-4 flex flex-col gap-4">
                  <Link href="/profile" className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    {profile?.email || "Profile"}
                  </Link>
                  <Button variant="ghost" className="justify-start px-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs mr-2">
              FF
            </div>
            <span className="font-bold font-mono">FileForge</span>
          </div>

          <div className="hidden md:block" /> {/* Spacer */}

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
