import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hemanth Pandiyaraj | Full-Stack Developer",
  description:
    "Full-stack developer in Edmonton. Two years at Deloitte building web applications and APIs, MSc from the University of Alberta. Projects with tests that prove they work.",
  openGraph: {
    title: "Hemanth Pandiyaraj | Full-Stack Developer",
    description: "APIs, data pipelines and AI tooling, built and tested end to end.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
