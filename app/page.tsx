import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "@/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = await getServerSession(cookieStore.toString());

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/auth");
  }
}
