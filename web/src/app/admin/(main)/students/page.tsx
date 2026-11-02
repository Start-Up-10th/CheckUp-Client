import { redirect } from "next/navigation";

/** 학생 관리(08)는 봉사자 명단(07)으로 합쳐졌다(DEC-116). 예전 주소·즐겨찾기는 봉사자 명단으로 보낸다. */
export default function AdminStudentsPage() {
  redirect("/admin/volunteers/add");
}
