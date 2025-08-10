
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CalendarClock,
  Building,
  Package,
  ShoppingCart,
  AreaChart,
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
import ProductsPage from "./products/page";
import { getCompanyDetails } from "../actions/company";

// Helper function to create a component map
const createPageMap = () => {
    const map: { [key: string]: React.ComponentType<any> & { title?: string; icon?: React.ElementType, isDynamic?: boolean, getTitle?: (props: any) => string; } } = {
        '/dashboard': DashboardPage,
        '/dashboard/bills': BillsPage,
        '/dashboard/bills/create': CreateBillPage,
        '/dashboard/quotations': QuotationsPage,
        '/dashboard/quotations/create': CreateQuotationPage,
        '/dashboard/expenses': ExpensesPage,
        '/dashboard/attendance': AttendancePage,
        '/dashboard/attendance/employees': ManageEmployeesPage,
        '/dashboard/account': AccountPage,
        '/dashboard/products': ProductsPage,
    };

    // Add dynamic routes with placeholder components
    map['/dashboard/bills/[billId]'] = ViewBillPage;
    map['/dashboard/quotations/[quotationId]'] = ViewQuotationPage;
    map['/dashboard/attendance/employees/[employeeId]'] = EmployeeReportPage;
    
    // Add metadata
    DashboardPage.title = "Dashboard";
    DashboardPage.icon = Home;
    BillsPage.title = "Sales Manager";
    BillsPage.icon = FileText;
    QuotationsPage.title = "Quotation Manager";
    QuotationsPage.icon = FileSearch;
    ExpensesPage.title = "Expenses Manager";
    ExpensesPage.icon = Wallet;
    AttendancePage.title = "Attendance Manager";
    AttendancePage.icon = Users;
    AccountPage.title = "Settings";
    AccountPage.icon = Settings;
    CreateBillPage.title = "Create Bill";
    CreateBillPage.icon = PlusCircle;
    CreateQuotationPage.title = "Create Quotation";
    CreateQuotationPage.icon = PlusCircle;
    ManageEmployeesPage.title = "Manage Employees";
    ManageEmployeesPage.icon = Users;
    ProductsPage.title = "Product Manager";
    ProductsPage.icon = Package;
    
    ViewBillPage.isDynamic = true;
    ViewQuotationPage.isDynamic = true;
    EmployeeReportPage.isDynamic = true;

    return map;
}

const pageComponents = createPageMap();

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/products", icon: Package, label: "Product Manager" },
  { href: "/dashboard/purchase", icon: ShoppingCart, label: "Purchase Manager" },
  { href: "/dashboard/bills", icon: FileText, label: "Sales Manager" },
  { href: "/dashboard/quotations", icon: FileSearch, label: "Quotation Manager" },
  { href: "/dashboard/expenses", icon: Wallet, label: "Expenses Manager" },
  { href: "/dashboard/attendance", icon: Users, label: "Attendance Manager" },
  { href: "/dashboard/reports", icon: AreaChart, label: "Reports Manager" },
  { href: "/dashboard/account", icon: Settings, label: "Settings" },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { openTabs, activeTab, openTab, closeTab, setActiveTab } = useAppState();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Loading...");

  useEffect(() => {
    getCompanyDetails().then(details => {
        setCompanyName(details.name || "My Company");
    })
  }, []);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (href === "/dashboard/purchase" || href === "/dashboard/reports") {
        // Placeholder for future implementation
        alert(`${href.split('/')[2].replace('-', ' ')} is not yet implemented.`);
        return;
    }

    const targetTab = navItems.find(item => item.href === href);
    if(targetTab){
      openTab({
          id: href,
          title: targetTab.label,
          icon: targetTab.icon,
          props: {}
      });
    }
  };

  const getPageKeyForPath = (path: string) => {
      const dynamicRoutePatterns = {
        '/dashboard/bills/[billId]': /^\/dashboard\/bills\/\d+$/,
        '/dashboard/quotations/[quotationId]': /^\/dashboard\/quotations\/\d+$/,
        '/dashboard/attendance/employees/[employeeId]': /^\/dashboard\/attendance\/employees\/\d+$/,
      };

      if (pageComponents[path]) return path;

      for (const key in dynamicRoutePatterns) {
          if (dynamicRoutePatterns[key as keyof typeof dynamicRoutePatterns].test(path)) {
              return key;
          }
      }

      return null;
  }
  
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
        <div className="sticky top-0 z-20 bg-background">
            <header className="flex h-16 items-center justify-between border-b bg-primary px-4 text-primary-foreground sm:px-6 print:hidden">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-white/20" />
                <div className="flex items-center gap-2">
                    <Building className="h-6 w-6" />
                    <span className="text-xl font-semibold">{companyName}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/20">
                    <Avatar className="h-8 w-8 bg-white/20">
                        <AvatarFallback className="bg-transparent text-primary-foreground">
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
            <div className="flex border-b bg-background print:hidden overflow-x-auto">
                {openTabs.map(tab => {
                    const TabIcon = tab.icon;
                    return (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 border-b-2 cursor-pointer text-sm flex-shrink-0",
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
        </div>

        <main className="flex-1 p-4 sm:p-6">
            {openTabs.map(tab => {
              const pageKey = getPageKeyForPath(tab.id);
              if (!pageKey) return null;
              
              const PageComponent = pageComponents[pageKey];

              return(
                <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
                    {PageComponent && React.createElement(PageComponent, tab.props)}
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
  return (
    <AppStateProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AppStateProvider>
  );
}
