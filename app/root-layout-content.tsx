"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const footerHidePaths = [
    "background-generator",
    "catalog-generator",
    "model-generation",
    "try-on",
    "edit-image",
  ];
  const hideNav = pathname?.includes("johnnywas");
  const hideFooter = footerHidePaths.some((path) => pathname?.includes(path));

  return (
    <div
      className={
        hideFooter ? "h-screen flex flex-col" : "min-h-screen flex flex-col"
      }
    >
      {!hideNav && <Navbar />}
      <main className="flex-1 flex flex-col">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
