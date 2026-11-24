import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lato, Hind_Siliguri } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AL-KAWSAR · প্রিমিয়াম সুক্কারি ও শামিয়া খেজুর",
  description:
    "সততার সাথে সংগৃহীত। বিশ্বাসের সাথে বিক্রি। সুক্কারি, শামিয়াসহ প্রিমিয়াম খেজুর — ডিস্ট্রিবিউটর ও রিটেইলার সরবরাহ। আজকের লাইভ দাম দেখুন।",
  keywords: ["AL-KAWSAR", "সুক্কারি খেজুর", "Sukkari dates", "শামিয়া খেজুর", "Shamia dates", "খেজুর পাইকারি", "wholesale dates"],
  applicationName: "AL-KAWSAR",
  openGraph: {
    title: "AL-KAWSAR · প্রিমিয়াম সুক্কারি ও শামিয়া খেজুর",
    description: "সততার সাথে সংগৃহীত। বিশ্বাসের সাথে বিক্রি। আজকের দাম দেখুন।",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B4D3C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${cormorant.variable} ${lato.variable} ${hindSiliguri.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-cream text-ink min-h-screen">
        {children}
        <Toaster position="top-center" richColors style={{ fontFamily: "var(--font-hind)" }} />
      </body>
    </html>
  );
}
