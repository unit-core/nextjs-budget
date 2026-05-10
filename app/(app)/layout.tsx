import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 border-b bg-background/80 backdrop-blur">
        <Link href="/" className="text-sm font-medium hover:opacity-80">
          Budget by Unitcore
        </Link>
        <UserMenu />
      </header>
      {children}
    </main>
  );
}
