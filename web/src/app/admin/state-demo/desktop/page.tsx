import { DeviceFramePreview } from "../_components/DeviceFramePreview";

// 로그인 없이 컴퓨터(1440px) 화면 확인. `?screen=mypage`처럼 화면을 고른다.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  const { screen } = await searchParams;
  return <DeviceFramePreview device="desktop" screen={screen} />;
}
