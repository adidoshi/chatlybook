import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { Poppins, Merriweather } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chatlybook",
  description:
    "Transform your books into interactive AI conversations. Upload PDFs & chat with your books using voice.",
  icons: {
    icon: "/book-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${merriweather.variable} relative font-sans antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <ClerkProvider ui={ui} afterSignOutUrl="/?signed_out=1">
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
