import type { Metadata } from "next";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/Tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Tech Path",
  description: "OPT and STEM OPT candidate placement platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TooltipProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "glass rounded-xl text-sm",
              duration: 3000,
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
