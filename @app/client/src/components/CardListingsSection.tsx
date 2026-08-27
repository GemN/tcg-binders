import type { CardListingFieldsFragment } from "@app/graphql";
import { useTranslation } from "react-i18next";

import { BinderCardFilters } from "@/components/BinderPageSearchFilters";
import {
  type CardListingSellerProfile,
  CardListingsTable,
  type FormatCardListingPrice,
} from "@/components/CardListingsTable";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/Button";
import { useIsMobile } from "@/hooks/useMobile";
import type { BinderCardFilterState } from "@/lib/binderPage";

interface CardListingsSectionProps {
  activeFilterCount: number;
  filterState: BinderCardFilterState;
  formatPrice: FormatCardListingPrice;
  hasNextPage: boolean;
  hasError?: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSellerLoading: boolean;
  listingCount: number;
  listings: CardListingFieldsFragment[];
  loadMoreError: boolean;
  sellerProfilesById: Map<string, CardListingSellerProfile>;
  showCardPreview?: boolean;
  onClearFilters: () => void;
  onFilterStateChange: (filterState: BinderCardFilterState) => void;
  onLoadMore: () => void;
}

export const CardListingsSection = ({
  activeFilterCount,
  filterState,
  formatPrice,
  hasNextPage,
  hasError = false,
  isLoading,
  isLoadingMore,
  isSellerLoading,
  listingCount,
  listings,
  loadMoreError,
  sellerProfilesById,
  showCardPreview = false,
  onClearFilters,
  onFilterStateChange,
  onLoadMore,
}: CardListingsSectionProps) => {
  const { t } = useTranslation("card");
  const isMobile = useIsMobile();

  return (
    <section className="pt-6" aria-label={t("listings")}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:justify-start">
        <BinderCardFilters
          activeFilterCount={activeFilterCount}
          filterState={filterState}
          filterButtonClassName="w-auto"
          idPrefix="card-listings-filter"
          isMobile={isMobile}
          onClearFilters={onClearFilters}
          onFilterStateChange={onFilterStateChange}
        />
        <p className="text-sm whitespace-nowrap text-secondary">
          {t("listing_count", { count: listingCount })}
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loading />
        </div>
      ) : hasError ? (
        <p className="rounded-md border border-destructive/30 bg-card p-6 text-center text-destructive">
          {t("load_error")}
        </p>
      ) : (
        <CardListingsTable
          formatPrice={formatPrice}
          isSellerLoading={isSellerLoading}
          listings={listings}
          sellerProfilesById={sellerProfilesById}
          showCardPreview={showCardPreview}
        />
      )}

      {hasNextPage && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="outline"
            isLoading={isLoadingMore}
            onClick={onLoadMore}
          >
            {t("load_more")}
          </Button>
          {loadMoreError && (
            <p className="text-sm text-destructive">{t("load_error")}</p>
          )}
        </div>
      )}
    </section>
  );
};
