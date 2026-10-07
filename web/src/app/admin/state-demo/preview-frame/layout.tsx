import { MockRoomProvider } from "../_components/MockRoomProvider";
import { MockVolunteerProvider } from "../_components/MockVolunteerProvider";
import { PreviewFrameShell } from "../_components/PreviewFrameShell";

export default function PreviewFrameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockVolunteerProvider>
      <MockRoomProvider>
        <PreviewFrameShell>{children}</PreviewFrameShell>
      </MockRoomProvider>
    </MockVolunteerProvider>
  );
}
