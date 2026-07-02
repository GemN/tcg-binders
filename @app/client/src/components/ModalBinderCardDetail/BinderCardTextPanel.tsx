import type { BinderCardDetailRecord } from "@/lib/binderCardPricing";

type CardDetail =
  | NonNullable<BinderCardDetailRecord["card"]>["mtgCardDetail"]
  | null;

interface BinderCardTextPanelProps {
  detail: CardDetail;
  title: string;
}

export const BinderCardTextPanel = ({
  detail,
  title,
}: BinderCardTextPanelProps) => (
  <>
    <div>
      <h2 className="text-2xl font-semibold leading-tight text-foreground">
        {title}
      </h2>
      {detail?.typeLine && (
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {detail.typeLine}
        </p>
      )}
    </div>

    {detail?.oracleText && (
      <div className="rounded-md border border-border bg-card p-4">
        <p className="whitespace-pre-line text-sm leading-6 text-card-foreground">
          {detail.oracleText}
        </p>
      </div>
    )}
  </>
);
