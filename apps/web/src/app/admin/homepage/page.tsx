import { redirect } from "next/navigation";

export default function AdminHomepageRoute() {
  redirect("/admin/pages?route=%2F");
}
