import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type SubscriptionStatus, PLAN_COLORS } from "@/lib/subscriptions";

const STRIPE_PORTAL_URL = "https://billing.stripe.com/p/login/3cIcMY3dvdmx2ibgdtcbC00";

type Props = {
  status: SubscriptionStatus;
};

const NEXT_PLAN: Record<string, string> = {
  free: "Starter",
  starter: "Professional",
  professional: "Premium",
  premium: "Enterprise",
};

const NEXT_PLAN_ROUTE: Record<string, string> = {
  free: "/pricing",
  starter: "/pricing",
  professional: "/pricing",
  premium: "/pricing",
};

export const PlanStatus = ({ status }: Props) => {
  const { plan, label, limit, activeCount } = status;
  const isEnterprise = plan === "enterprise";
  const isAtLimit = !isEnterprise && activeCount >= limit;
  const pct = isEnterprise ? 0 : Math.min(100, Math.round((activeCount / limit) * 100));
  const remaining = isEnterprise ? null : limit - activeCount;
  const colorClass = PLAN_COLORS[plan as keyof typeof PLAN_COLORS] ?? PLAN_COLORS.free;
  const nextPlan = NEXT_PLAN[plan];

  return (
    <Card className={`mb-6 border ${isAtLimit ? "border-destructive/40 bg-destructive/5" : "border-border"}`}>
      <CardContent className="py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="outline" className={`shrink-0 text-xs font-semibold ${colorClass}`}>
              {label}
            </Badge>
            <div className="min-w-0">
              {isEnterprise ? (
                <p className="text-sm text-muted-foreground">Απεριόριστες ενεργές αγγελίες</p>
              ) : (
                <div>
                  <p className="text-sm font-medium">
                    {activeCount} / {limit} ενεργές αγγελίες
                    {isAtLimit && (
                      <span className="ml-2 text-xs font-semibold text-destructive">— Όριο πακέτου</span>
                    )}
                  </p>
                  <Progress
                    value={pct}
                    className={`mt-1.5 h-1.5 w-48 ${isAtLimit ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"}`}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {!isEnterprise && (
              <Button asChild size="sm" variant="ghost">
                <a href={STRIPE_PORTAL_URL} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Συνδρομές & Τιμολόγια
                </a>
              </Button>
            )}
            {nextPlan && (
              <Button
                asChild
                size="sm"
                variant={isAtLimit ? "default" : "outline"}
              >
                <Link to={NEXT_PLAN_ROUTE[plan] ?? "/pricing"}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {isAtLimit
                    ? `Αναβάθμιση σε ${nextPlan}`
                    : `${remaining !== null ? `${remaining} εναπομείνασες θέσεις` : ""} · Αναβάθμιση`}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
