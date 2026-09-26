export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="relative h-screen w-full bg-admin-bg">{children}</div>;
}
