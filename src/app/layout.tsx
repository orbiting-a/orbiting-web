import type { Metadata } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Web3Provider } from "@/components/providers/Web3Provider";
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
  title: {
    default: "Orbiting — Communities That Move With You",
    template: "%s | Orbiting",
  },
  description:
    "Join Orbiting — discover communities, connect with people nearby, and share what matters. Your social universe, in orbit.",
  keywords: ["social network", "communities", "orbits", "events", "chat"],
  openGraph: {
    title: "Orbiting",
    description: "Communities That Move With You",
    type: "website",
    siteName: "Orbiting",
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
          <ThemeProvider>{children}</ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
