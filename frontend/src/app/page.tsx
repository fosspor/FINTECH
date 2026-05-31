import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const hasSeenWelcome = cookieStore.get("finbro_seen_welcome")?.value === "1";
  const hasAuth = cookieStore.get("finbro_auth_ready")?.value === "1";

  if (!hasSeenWelcome) redirect("/welcome");
  redirect(hasAuth ? "/chat" : "/auth");
}
