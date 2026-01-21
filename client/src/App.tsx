import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import BomMaster from "@/pages/BomMaster";
import { LayoutDashboard, Package, Settings, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer mb-1",
        isActive 
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}>
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
      </div>
    </Link>
  );
}

function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-100 flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50 hidden md:flex">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Wrench className="w-6 h-6 text-accent mr-3" />
        <div>
          <h1 className="font-display font-bold text-lg tracking-wider">JD JONES</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Supervisor System</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 py-6 px-3">
        <p className="px-3 text-xs font-bold text-slate-600 uppercase mb-3 tracking-wider">Modules</p>
        <NavLink href="/" icon={LayoutDashboard} label="Production Floor" />
        <NavLink href="/bom" icon={Package} label="BOM Master" />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <Settings className="w-5 h-5" />
          <span className="text-sm">System Settings</span>
        </div>
      </div>
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="md:hidden h-16 bg-slate-900 text-white flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
       <div className="flex items-center gap-2">
         <Wrench className="w-5 h-5 text-accent" />
         <span className="font-display font-bold tracking-wider">JD JONES</span>
       </div>
       <div className="flex gap-4 text-sm">
         <Link href="/" className="text-slate-400 hover:text-white">Prod</Link>
         <Link href="/bom" className="text-slate-400 hover:text-white">BOM</Link>
       </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/bom" component={BomMaster} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Sidebar />
          <MobileHeader />
          <main className="md:pl-64 pt-16 md:pt-0 min-h-screen transition-all">
            <div className="container mx-auto p-4 md:p-8 max-w-7xl">
              <Router />
            </div>
          </main>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
