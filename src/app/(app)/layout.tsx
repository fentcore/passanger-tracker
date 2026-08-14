import { redirect } from "next/navigation";
import { requireUsuario } from "@/lib/auth-helpers";
import { BottomNav, TopNav } from "@/components/nav";
import { UserMenu } from "@/components/user-menu";
import { AutoRefresh } from "@/components/auto-refresh";
import { Bus } from "lucide-react";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireUsuario();
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AutoRefresh />
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bus className="size-5" />
            </span>
            <span className="hidden sm:inline">Passenger Tracker</span>
          </Link>
          <TopNav />
          <UserMenu nombre={user.nombre} rol={user.rol} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-3 pb-24 pt-4 sm:px-4 md:pb-8">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
