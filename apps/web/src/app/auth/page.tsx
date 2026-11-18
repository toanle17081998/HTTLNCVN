import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default function AuthRoute() {
  return <AuthPage />;
}
