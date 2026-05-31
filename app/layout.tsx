import type { Metadata } from "next";
import "./globals.css";

import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Personal AI OS",
  description: "AI-powered personal operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}