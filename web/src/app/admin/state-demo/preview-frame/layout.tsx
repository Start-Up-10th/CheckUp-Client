import { PreviewFrameShell } from "../_components/PreviewFrameShell";

export default function PreviewFrameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PreviewFrameShell>{children}</PreviewFrameShell>;
}
