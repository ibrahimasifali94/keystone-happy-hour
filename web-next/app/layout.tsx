export const metadata = {
  title: "Keystone Happy Hour",
  description: "Find nearby happy hours, fast.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-sans-serif, system-ui" }}>{children}</body>
    </html>
  );
}
