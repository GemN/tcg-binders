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
      <h2 className="text-2xl font-semibold leading-tight text-[#2d4059]">
        {title}
      </h2>
      {detail?.typeLine && (
        <p className="mt-1 text-sm font-medium text-[#6f6570]">
          {detail.typeLine}
        </p>
      )}
    </div>

    {detail?.oracleText && (
      <div className="rounded-md border border-[#d8d1c3] bg-[#fffdf7] p-4">
        <p className="whitespace-pre-line text-sm leading-6 text-[#343434]">
          {detail.oracleText}
        </p>
      </div>
    )}
  </>
);
