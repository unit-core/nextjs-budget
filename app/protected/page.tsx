import { TransactionInput } from "@/components/transaction-input";



export default function ProtectedPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4">
      <div className="relative w-full max-w-xl">
        <TransactionInput />
      </div>
    </div>
  );
}
