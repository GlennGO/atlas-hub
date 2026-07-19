import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas Hub — El Hub donde tu IA crea, organiza y entrega",
  description:
    "Command center AI-native para agencias. Visualiza todo lo que tu IA produce, organizado por proyecto y cliente.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="font-sans text-sm antialiased">
        {children}
      </body>
    </html>
  );
}
