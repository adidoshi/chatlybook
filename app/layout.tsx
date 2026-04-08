import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { Mona_Sans, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chatlybook",
  description:
    "Transform your books into interactive AI conversations. Upload PDFs & chat with your books using voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider ui={ui}>
      <ThemeProvider>
        <html
          lang="en"
          className={`${poppins.variable} ${monaSans.variable} relative font-sans antialiased`}
        >
          <body className="min-h-full flex flex-col">
            <Navbar />
            {children}
            <Toaster />
          </body>
        </html>
      </ThemeProvider>
    </ClerkProvider>
  );
}
