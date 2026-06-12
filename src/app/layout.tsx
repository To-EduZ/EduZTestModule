import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Đánh Giá & Luyện Nói Tiếng Anh Cambridge - KidSpeak 🚀",
  description: "Web App luyện kỹ năng nói Tiếng Anh theo chuẩn Cambridge (Starters, Movers, Flyers) với AI chấm điểm thông minh dành cho trẻ em 6-11 tuổi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script to prevent flash of wrong theme on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-pastel-bg dark:bg-dark-bg text-slate-800 dark:text-slate-200 font-sans selection:bg-sunbeam selection:text-amber-950 transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
