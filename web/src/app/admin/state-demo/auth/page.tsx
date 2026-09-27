import { AdminContentState } from "@/components/admin/AdminContentState";

export default function Page() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4 md:px-[22px] md:py-6">
      <div className="flex w-full max-w-[460px] items-center justify-center rounded-[18px] bg-admin-surface p-6 xl:rounded-panel">
        <AdminContentState variant="auth" />
      </div>
    </div>
  );
}
