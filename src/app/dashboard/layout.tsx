"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Home,
  LogOut,
  Settings,
  User,
  FileSearch,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { AppStateProvider, useAppState } from "@/hooks/use-app-state";
import { cn } from "@/lib/utils";
import DashboardPage from "./page";
import BillsPage from "./bills/page";
import QuotationsPage from "./quotations/page";
import ExpensesPage from "./expenses/page";
import AttendancePage from "./attendance/page";
import AccountPage from "./account/page";
import CreateBillPage from "./bills/create/page";
import CreateQuotationPage from "./quotations/create/page";

const pageComponents: { [key: string]: React.ComponentType<any> & { title: string; icon: React.ElementType } } = {
  '/dashboard': DashboardPage,
  '/dashboard/bills': BillsPage,
  '/dashboard/quotations': QuotationsPage,
  '/dashboard/expenses': ExpensesPage,
  '/dashboard/attendance': AttendancePage,
  '/dashboard/account': AccountPage,
  '/dashboard/bills/create': CreateBillPage,
  '/dashboard/quotations/create': CreateQuotationPage,
};

// Add static properties to page components for metadata
DashboardPage.title = "Dashboard";
DashboardPage.icon = Home;
BillsPage.title = "Bills";
BillsPage.icon = FileText;
QuotationsPage.title = "Quotations";
QuotationsPage.icon = FileSearch;
ExpensesPage.title = "Expenses";
ExpensesPage.icon = Wallet;
AttendancePage.title = "Attendance";
AttendancePage.icon = Users;
AccountPage.title = "Account";
AccountPage.icon = User;
CreateBillPage.title = "Create Bill";
CreateBillPage.icon = FileText;
CreateQuotationPage.title = "Create Quotation";
CreateQuotationPage.icon = FileSearch;


const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/bills", icon: FileText, label: "Bills" },
  { href: "/dashboard/quotations", icon: FileSearch, label: "Quotations" },
  { href: "/dashboard/expenses", icon: Wallet, label: "Expenses" },
  { href: "/dashboard/attendance", icon: Users, label: "Attendance" },
  { href: "/dashboard/account", icon: User, label: "Account" },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { openTabs, activeTab, openTab, closeTab, setActiveTab } = useAppState();
  const router = useRouter();

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const component = pageComponents[href];
    if (component) {
        openTab({
            id: href,
            title: component.title,
            icon: component.icon,
        });
    }
  };
  
  const ActiveComponent = activeTab ? pageComponents[activeTab] : null;

  return (
    <SidebarProvider>
      <Sidebar className="print:hidden">
        <SidebarHeader>
          <div className="p-2">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={activeTab === item.href}
                  tooltip={item.label}
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 print:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="#" onClick={(e) => handleNavClick(e, '/dashboard/account')}><Settings className="mr-2 h-4 w-4" />Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/')}>
                  <LogOut className="mr-2 h-4 w-4" />Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Tab Bar */}
        <div className="flex border-b bg-background print:hidden">
            {openTabs.map(tab => {
                const TabIcon = tab.icon;
                return (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 border-b-2 cursor-pointer text-sm",
                            activeTab === tab.id
                                ? "border-primary text-primary font-semibold"
                                : "border-transparent text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <TabIcon className="h-4 w-4" />
                        <span>{tab.title}</span>
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-2 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                closeTab(tab.id);
                            }}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                );
            })}
        </div>

        <main className="flex-1 p-4 sm:p-6">
            {ActiveComponent ? <ActiveComponent /> : children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  return (
    <AppStateProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AppStateProvider>
  );
}
