import type { Metadata } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  title: "James | Portfolio OS",
  description: "Interactive Web Desktop Portfolio with dual macOS & Windows 11 experiences",
  icons: {
    icon: "/src/assets/code-xml.png"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="overflow-hidden bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

