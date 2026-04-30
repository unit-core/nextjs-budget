import { TransactionInput } from "@/components/transaction-input";
import { MonthlySummary } from "@/components/monthly-summary";

export default function ProtectedPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4">
      <div className="relative w-full max-w-xl">
        {/* <div className="absolute bottom-full left-0 mb-2">
          <MonthlySummary />
        </div> */}
        <TransactionInput />
      </div>
    </div>
  );
}
