import { redirect } from "next/navigation";
import { getWallet } from "@/lib/session";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const wallet = await getWallet();
  if (wallet) redirect("/chat");

  return <LoginClient />;
}
