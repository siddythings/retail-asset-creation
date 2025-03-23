"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Shirt as Tshirt, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Model Generation", path: "/model-generation" },
    { name: "Try On", path: "/try-on" },
    { name: "Background Generator", path: "/background-generator" },
    { name: "Image Tagging", path: "/image-tagging" },
    { name: "Edit Image", path: "/edit-image" },
    { name: "Product Generator", path: "/product-generator" },
    { name: "All In One", path: "/all-in-one" },
    { name: "Gallery", path: "/gallery" },
    { name: "Profile", path: "/profile" },
    { name: "Johnny Was", path: "/johnnywas", target: "_blank" as const },
  ] as const;

  type NavItem = {
    name: string;
    path: string;
    target?: "_blank" | undefined;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 mr-4 sm:mr-6">
          <Tshirt className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">VirtualFit</span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="sr-only">Open main menu</span>
          {isMenuOpen ? (
            <X className="block h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="block h-5 w-5" aria-hidden="true" />
          )}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-4">
          {navItems.map((item: NavItem) => (
            <Link
              key={item.path}
              href={item.path}
              {...(item.target && {
                target: item.target,
                rel: "noopener noreferrer",
              })}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.path
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          <ModeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/try-on">Start Try-On</Link>
          </Button>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-3 space-y-1 bg-background border-b">
            {navItems.map((item: NavItem) => (
              <Link
                key={item.path}
                href={item.path}
                {...(item.target && {
                  target: item.target,
                  rel: "noopener noreferrer",
                })}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.path
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 pb-1">
              <Button asChild className="w-full" size="sm">
                <Link href="/try-on" onClick={() => setIsMenuOpen(false)}>
                  Start Try-On
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
