import { MockVolunteerProvider } from "../_components/MockVolunteerProvider";
import { PreviewFrameShell } from "../_components/PreviewFrameShell";

export default function PreviewFrameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockVolunteerProvider>
      <PreviewFrameShell>{children}</PreviewFrameShell>
    </MockVolunteerProvider>
  );
}
