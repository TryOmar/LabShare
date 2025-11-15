import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Redirect to login or dashboard based on session
  redirect("/login");
}
