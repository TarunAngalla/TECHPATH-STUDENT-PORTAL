import { redirect } from "next/navigation";

/** Legacy route — all roles sign in at `/login`. */
export default function AdminLoginPage() {
  redirect("/login");
}
