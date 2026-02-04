import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, PiggyBank } from "lucide-react";

export default function AdminFinance() {
  const financeCards = [
    {
      title: "Total Revenue",
      value: "$0.00",
      icon: DollarSign,
      description: "All time earnings",
      change: "+0%",
    },
    {
      title: "This Month",
      value: "$0.00",
      icon: TrendingUp,
      description: "Current month revenue",
      change: "+0%",
    },
    {
      title: "Ad Revenue",
      value: "$0.00",
      icon: CreditCard,
      description: "From advertisements",
      change: "+0%",
    },
    {
      title: "Donations",
      value: "$0.00",
      icon: PiggyBank,
      description: "User contributions",
      change: "+0%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revenue tracking and financial overview
        </p>
      </div>

      {/* Finance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financeCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                  <span className="ml-1 text-primary">{card.change}</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Detailed financial analytics</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Financial tracking and analytics coming soon
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect payment providers to start tracking revenue
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
