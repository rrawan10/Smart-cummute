import "./globals.css";
export const metadata = { title: "مساعد الطريق" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
