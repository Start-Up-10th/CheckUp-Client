export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen w-full bg-[#f5f5f7] md:bg-admin-bg">
      {children}
    </div>
  );
}
