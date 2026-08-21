import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono, Quicksand } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GameProvider } from "@/lib/store";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life RPG — your life, levelled up",
  description:
    "A cozy local-first life RPG: turn goals into quests, habits into streaks, and skills into levels.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${beVietnam.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <GameProvider>{children}</GameProvider>
        <Analytics />
      </body>
    </html>
  );
}
