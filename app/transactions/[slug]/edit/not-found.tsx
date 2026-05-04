import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function TransactionNotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Transaction not found</CardTitle>
          <CardDescription>
            We couldn’t find a transaction with this ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          It may have been deleted, or the link may be incorrect.
        </CardContent>
        <CardFooter className="justify-end">
          <Button asChild>
            <Link href="/transactions">Back to list</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
