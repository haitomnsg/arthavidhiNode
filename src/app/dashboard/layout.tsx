
"use client";

import React from "react";
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
  PlusCircle,
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
import ViewBillPage from "./bills/[billId]/page";
import QuotationsPage from "./quotations/page";
import ViewQuotationPage from "./quotations/[quotationId]/page";
import ExpensesPage from "./expenses/page";
import AttendancePage from "./attendance/page";
import AccountPage from "./account/page";
import CreateBillPage from "./bills/create/page";
import CreateQuotationPage from "./quotations/create/page";
import ManageEmployeesPage from "./attendance/employees/page";
import EmployeeReportPage from "./attendance/employees/[employeeId]/page";

const pageComponents: { [key: string]: React.ComponentType<any> & { title?: string; icon?: React.ElementType, isDynamic?: boolean } } = {
  '/dashboard': DashboardPage,
  '/dashboard/bills': BillsPage,
  '/dashboard/bills/create': CreateBillPage,
  '/dashboard/bills/[billId]': ViewBillPage,
  '/dashboard/quotations': QuotationsPage,
  '/dashboard/quotations/create': CreateQuotationPage,
  '/dashboard/quotations/[quotationId]': ViewQuotationPage,
  '/dashboard/expenses': ExpensesPage,
  '/dashboard/attendance': AttendancePage,
  '/dashboard/attendance/employees': ManageEmployeesPage,
  '/dashboard/attendance/employees/[employeeId]': EmployeeReportPage,
  '/dashboard/account': AccountPage,
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
CreateBillPage.icon = PlusCircle;
CreateQuotationPage.title = "Create Quotation";
CreateQuotationPage.icon = PlusCircle;
ManageEmployeesPage.title = "Manage Employees";
ManageEmployeesPage.icon = Users;
ViewBillPage.isDynamic = true;
ViewQuotationPage.isDynamic = true;
EmployeeReportPage.isDynamic = true;

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
            title: component.title || "Page",
            icon: component.icon || FileText,
            props: {}
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
            {openTabs.map(tab => {
              const PageComponent = pageComponents[tab.id];

              return(
                <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
                    {PageComponent && React.createElement(PageComponent)}
                </div>
              )
            })}
            {openTabs.length === 0 && children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  // The dynamic pages are now handled inside the RootLayout for the dashboard
  // so we don't need to pass them down as children to the AppStateProvider specifically.
  // The layout will handle rendering the correct page based on the active tab.
  
  const pathname = usePathname();

  const isDynamicPage = (path: string) => {
    return /\/dashboard\/(bills|quotations|attendance\/employees)\/\d+/.test(path);
  }

  if (isDynamicPage(pathname)) {
    let Component;
    const props: { params?: { billId?: number, quotationId?: number, employeeId?: number }} = {};

    if (pathname.includes('/dashboard/bills/')) {
      Component = ViewBillPage;
      props.params = { billId: parseInt(pathname.split('/').pop()!) };
    } else if (pathname.includes('/dashboard/quotations/')) {
      Component = ViewQuotationPage;
       props.params = { quotationId: parseInt(pathname.split('/').pop()!) };
    } else if (pathname.includes('/dashboard/attendance/employees/')) {
      Component = EmployeeReportPage;
      props.params = { employeeId: parseInt(pathname.split('/').pop()!) };
    }
    
    if (Component) {
      // Render dynamic pages outside the main tabbed layout for simplicity
      return (
        <div className="flex-1 p-4 sm:p-6">
          <Component {...props} />
        </div>
      );
    }
  }

  return (
    <AppStateProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AppStateProvider>
  );
}
