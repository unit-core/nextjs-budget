import { SubscribeButton } from "./subscribe-button";

const plans = [
  {
    name: "Weekly",
    price: "$4.99 / week",
    description: "Billed every week",
    priceId: process.env.STRIPE_WEEKLY_PRICE_ID!,
  },
  {
    name: "Yearly",
    price: "$39.99 / year",
    description: "Billed once a year — best value",
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choose a plan</h1>
        <p className="mt-2 text-muted-foreground">
          Subscribe to get access to all features
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="flex-1 border rounded-xl p-6 flex flex-col gap-4"
          >
            <div>
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="text-3xl font-bold mt-1">{plan.price}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.description}
              </p>
            </div>
            <SubscribeButton priceId={plan.priceId} />
          </div>
        ))}
      </div>
    </main>
  );
}
