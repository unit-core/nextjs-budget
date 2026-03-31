"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDirection } from "@/i18n/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PilcrowLeftIcon } from "lucide-react";

export function LayoutDirectionPicker({
  direction,
}: {
  direction: "ltr" | "rtl";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      await setDirection(value as "ltr" | "rtl");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <PilcrowLeftIcon className="size-4 text-muted-foreground" />
      <Select value={direction} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ltr">LTR — Left to Right</SelectItem>
          <SelectItem value="rtl">RTL — Right to Left</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
