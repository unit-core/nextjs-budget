import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { UserMenu } from "@/components/user-menu"


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="absolute top-4 right-4 z-10">
        <div className="flex flex-row items-center">
          <HoverCard openDelay={10} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button variant="link" size="sm" className="text-muted-foreground">
                1235 EUR
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="flex w-full flex-col gap-0.5">
              <div className="font-semibold">@nextjs</div>
              <div>The React Framework – created and maintained by @vercel.</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Joined December 2021
              </div>
            </HoverCardContent>
          </HoverCard>
          <UserMenu />
        </div>
      </div>
      {children}
    </main>
  );
}
