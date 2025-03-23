import Link from "next/link";
import { Shirt as Tshirt } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 px-4 sm:px-6 lg:px-8 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Tshirt className="h-5 w-5" />
            <span className="font-bold">VirtualFit</span>
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} VirtualFit. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}