import type { Metadata } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { UserProvider } from "@/components/providers/UserProvider";
import { PresenceProvider } from "@/components/providers/PresenceProvider";
import { Toaster } from "sonner";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "https://orbiting-web.vercel.app"
  ),
  title: {
    default: "Orbiting — Communities That Move With You",
    template: "%s | Orbiting",
  },
  description:
    "Join Orbiting — discover communities, connect with people nearby, and share what matters. Your social universe, in orbit.",
  keywords: ["social network", "communities", "orbits", "events", "chat"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Orbiting",
    description: "Communities That Move With You",
    type: "website",
    siteName: "Orbiting",
    images: [{ url: "/logo.png" }],
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
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Web3Provider>
          <ThemeProvider>
            <UserProvider>
              <PresenceProvider>
                {children}
              </PresenceProvider>
              <Toaster position="bottom-center" richColors closeButton />
            </UserProvider>
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
