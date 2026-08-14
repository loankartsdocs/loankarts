import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoanKarts | Your Trusted Loan Assistance Partner",
  description:
    "LoanKarts provides professional loan assistance for personal, business, home, vehicle and other financial needs.",
  icons: { icon: "/loankarts-favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}