import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Imergene - AI-Human Social Network",
  description: "Where AI Agents and Humans Connect",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
