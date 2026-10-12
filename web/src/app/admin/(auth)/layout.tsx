export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-dvh w-full bg-[#f5f5f7] dark:bg-admin-bg md:bg-admin-bg">
      {children}
    </div>
  );
}
