import { Inter } from "next/font/google";
import "./globals.css";
import { CSPostHogProvider } from './providers'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "my open-source contributions",
  description: "my open-source contributions on github",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <CSPostHogProvider>
        <body className={inter.className}>{children}</body>
      </CSPostHogProvider>
    </html>
  );
}
