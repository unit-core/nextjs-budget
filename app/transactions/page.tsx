import { Coffee, ShoppingCart, Wallet, Car, Tv, MoreHorizontal, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type Transaction = {
    id: string
    icon: LucideIcon
    name: string
    category: string
    date: string
    amount: number
}

const transactions: Transaction[] = [
    { id: "1", icon: Coffee, name: "Blue Bottle Coffee", category: "Food & Drink", date: "Today, 10:24 AM", amount: -6.5 },
    { id: "2", icon: ShoppingCart, name: "Whole Foods Market", category: "Groceries", date: "Yesterday", amount: -142.3 },
    { id: "3", icon: Wallet, name: "Stripe Payout", category: "Income", date: "Oct 12", amount: 4200 },
    { id: "4", icon: Car, name: "Uber Technologies", category: "Transport", date: "Oct 11", amount: -24.1 },
    { id: "5", icon: Tv, name: "Netflix Subscription", category: "Entertainment", date: "Oct 10", amount: -19.99 },
]

function formatAmount(amount: number) {
    const sign = amount > 0 ? "+" : "-"
    const formatted = Math.abs(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
    return `${sign}$${formatted}`
}

export default async function TransactionsPage() {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Your latest account activity.</CardDescription>
                        <CardAction>
                            <Button variant="outline" size="sm">
                                View All
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                {transactions.map((tx) => {
                                    const Icon = tx.icon
                                    const isIncome = tx.amount > 0
                                    return (
                                        <TableRow key={tx.id}>
                                            <TableCell className="w-10">
                                                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                                    <Icon className="size-4 shrink-0" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{tx.name}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {tx.category}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {tx.date}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={cn(
                                                        "text-sm font-semibold tabular-nums",
                                                        isIncome && "text-emerald-500",
                                                    )}
                                                >
                                                    {formatAmount(tx.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="size-8">
                                                            <MoreHorizontal />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>View details</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
