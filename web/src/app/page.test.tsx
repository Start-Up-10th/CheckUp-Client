import { redirect } from "next/navigation";
import RootPage from "./page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("RootPage", () => {
  it("/admin/login으로 리다이렉트한다", () => {
    RootPage();
    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
