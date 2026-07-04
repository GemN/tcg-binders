import { useTranslation } from "react-i18next";

import { CopyToClipboardButton } from "@/components/CopyToClipboardButton";
import { Textarea } from "@/components/ui/Textarea";

export interface SellerMessage {
  message: string;
  sellerId: string;
  sellerName: string;
}

interface SellerMessagesSectionProps {
  messages: SellerMessage[];
}

export const SellerMessagesSection = ({
  messages,
}: SellerMessagesSectionProps) => {
  const { t } = useTranslation(["checkout"]);

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">
          {t("checkout:messages_title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("checkout:messages_description")}
        </p>
      </div>

      {messages.map((message) => (
        <article
          key={message.sellerId}
          className="rounded-md border border-border bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">
              {t("checkout:message_for", { seller: message.sellerName })}
            </h3>
            <CopyToClipboardButton value={message.message} />
          </div>
          <Textarea
            readOnly
            value={message.message}
            className="min-h-72 resize-y whitespace-pre-wrap font-mono text-sm leading-6"
          />
        </article>
      ))}
    </section>
  );
};
