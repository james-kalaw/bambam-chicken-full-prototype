import { CustomerBottomNav, CustomerHeader } from "@/components/customer/customer-nav";
import { CustomerBambam } from "@/components/customer/customer-bambam";
import { DemoSwitcher } from "@/components/shared/demo-switcher";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-customer min-h-dvh bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <CustomerBambam>
        <CustomerHeader />
        {/* Extra bottom space so the floating Bambam button never covers the last button on the page */}
        <main id="main" className="mx-auto max-w-6xl px-4 pt-4 pb-40 md:pb-28">
          {children}
        </main>
        <CustomerBottomNav />
        <DemoSwitcher />
      </CustomerBambam>
    </div>
  );
}
