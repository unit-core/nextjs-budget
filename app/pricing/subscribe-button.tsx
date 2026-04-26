"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SubscribeButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <Button className="w-full" onClick={handleSubscribe} disabled={loading}>
      {loading ? "Redirecting..." : "Subscribe"}
    </Button>
  );
}
