import { UserMenu } from "@/components/user-menu"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="absolute top-4 right-4 z-10">
        <UserMenu />
      </div>
      {children}
    </main>
  );
}
