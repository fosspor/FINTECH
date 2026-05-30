import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const hasSeenWelcome = cookieStore.get("finbro_seen_welcome")?.value === "1";

  redirect(hasSeenWelcome ? "/chat" : "/welcome");
}
