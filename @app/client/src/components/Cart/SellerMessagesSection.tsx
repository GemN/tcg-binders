import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { CountryFlag } from "@/components/CountryFlag";
import { CopyToClipboardButton } from "@/components/CopyToClipboardButton";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export interface SellerMessage {
  binderCardIds: string[];
  itemCount: number;
  message: string;
  sellerCountry: string | null;
  sellerId: string;
  sellerName: string;
  totalLabel: string;
}

interface SellerMessagesSectionProps {
  messages: SellerMessage[];
  showHeader?: boolean;
  onCompleteSeller: (binderCardIds: string[]) => void;
}

export const SellerMessagesSection = ({
  messages,
  showHeader = true,
  onCompleteSeller,
}: SellerMessagesSectionProps) => {
  const { t } = useTranslation(["checkout"]);

  return (
    <section className="grid gap-4">
      {showHeader && (
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {t("checkout:messages_title")}
          </h2>
        </div>
      )}

      {messages.map((message) => (
        <article
          key={message.sellerId}
          className="rounded-md border border-border bg-card p-4"
        >
          <div className="mb-3 grid gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link
                    to={`/user/${encodeURIComponent(message.sellerName.trim())}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {message.sellerCountry && (
                      <CountryFlag
                        code={message.sellerCountry}
                        className="h-[13.5px] w-[18px]"
                        label={message.sellerCountry}
                      />
                    )}
                    <h3 className="truncate font-display text-lg font-semibold">
                      {message.sellerName}
                    </h3>
                  </Link>
                  <span
                    aria-hidden="true"
                    className="h-4 w-px self-center bg-border"
                  />
                  <p className="text-base font-semibold tabular-nums text-foreground">
                    {message.totalLabel}
                  </p>
                  <span
                    aria-hidden="true"
                    className="h-4 w-px self-center bg-border"
                  />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("checkout:item_count", { count: message.itemCount })}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("checkout:message_copy_instruction")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onCompleteSeller(message.binderCardIds)}
                >
                  <Check className="size-4" />
                  {t("checkout:clear_seller")}
                </Button>
                <CopyToClipboardButton
                  value={message.message}
                  size="sm"
                  showLabel
                />
              </div>
            </div>
          </div>
          <Textarea
            readOnly
            value={message.message}
            className="min-h-72 max-h-[28rem] resize-y overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-6"
          />
        </article>
      ))}
    </section>
  );
};
