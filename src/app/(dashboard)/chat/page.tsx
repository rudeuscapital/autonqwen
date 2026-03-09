import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { listSessions } from "@/lib/memory";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  let wallet;
  try {
    wallet = await requireAuth();
  } catch {
    redirect("/login");
  }

  const sessions = listSessions();

  return <ChatClient wallet={wallet} initialSessions={sessions} />;
}
