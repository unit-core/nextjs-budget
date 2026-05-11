import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur">
        <Link href="/" className="text-sm font-medium hover:opacity-80">
          Budget by Unitcore
        </Link>
        <div className="flex items-center gap-3">
          <a href="https://www.buymeacoffee.com/unitcore" target="_blank" rel="noopener noreferrer">
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/arial-yellow.png"
              alt="Buy Me a Coffee"
              style={{ height: "40px", width: "145px" }}
            />
          </a>
          <UserMenu />
        </div>
      </header>
      {children}
    </main>
  );
}
