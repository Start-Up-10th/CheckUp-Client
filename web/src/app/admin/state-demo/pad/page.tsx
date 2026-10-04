import { DeviceFramePreview } from "../_components/DeviceFramePreview";

// 로그인 없이 패드(768px) 화면 확인. `?screen=roster`로 07을 연다.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  const { screen } = await searchParams;
  return <DeviceFramePreview device="pad" screen={screen} />;
}
