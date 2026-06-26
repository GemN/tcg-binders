import type { BinderCardVariantsQuery } from "@app/graphql";

import type {
  BinderCardDetailRecord,
  BinderCardRecord,
} from "@/lib/binderCardPricing";

export type ModalBinderCardRecord = BinderCardRecord | BinderCardDetailRecord;

export type BinderCardVariant = NonNullable<
  NonNullable<
    BinderCardVariantsQuery["cardsCollection"]
  >["edges"][number]["node"]
>;

export type PriceMode = "manual" | "dynamic";
export type DynamicPriceStrategy = "CKD X";
