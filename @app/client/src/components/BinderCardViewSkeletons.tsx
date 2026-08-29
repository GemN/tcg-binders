import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const LIST_SKELETON_COLUMN_COUNT = 6;
const listSkeletonDesktopGridClassName =
  "grid-cols-[minmax(18rem,2fr)_minmax(10rem,1fr)_4rem_minmax(8rem,0.8fr)_minmax(16rem,1.5fr)_8rem]";
const selectableListSkeletonDesktopGridClassName =
  "grid-cols-[2.5rem_minmax(18rem,2fr)_minmax(10rem,1fr)_4rem_minmax(8rem,0.8fr)_minmax(16rem,1.5fr)_8rem]";

export const BinderCardGridSkeleton = ({ count }: { count: number }) => {
  const skeletonItems = Array.from(
    { length: count },
    (_, index) => `grid-skeleton-${index}`
  );

  return (
    <div className="grid h-auto grid-cols-2 place-items-start content-start gap-3 gap-y-6 sm:grid-cols-4 md:h-full lg:grid-cols-7">
      {skeletonItems.map((skeletonItem) => (
        <div key={skeletonItem} className="grid w-full max-w-[12rem] gap-2">
          <Skeleton className="aspect-[63/88] w-full rounded-md bg-binder-toolbar/25" />
          <div className="grid min-h-12 justify-items-end gap-1">
            <Skeleton className="h-5 w-24 bg-binder-toolbar/25" />
            <Skeleton className="h-4 w-20 bg-binder-toolbar/20" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface BinderCardListSkeletonProps {
  count: number;
  isOwnerView: boolean;
  isSelectionMode?: boolean;
  showBuyerCartAction: boolean;
}

export const BinderCardListSkeleton = ({
  count,
  isOwnerView,
  isSelectionMode,
  showBuyerCartAction,
}: BinderCardListSkeletonProps) => {
  const showMobileTopAction = isOwnerView || !!isSelectionMode;
  const showMobileBottomAction = showBuyerCartAction && !isSelectionMode;
  const skeletonColumnCount =
    LIST_SKELETON_COLUMN_COUNT + (isSelectionMode ? 1 : 0);
  const skeletonColumns = Array.from(
    { length: skeletonColumnCount },
    (_, index) => `list-skeleton-column-${index}`
  );
  const skeletonRows = Array.from(
    { length: count },
    (_, index) => `list-skeleton-row-${index}`
  );

  return (
    <>
      <div className="grid gap-4 md:hidden">
        {skeletonRows.map((skeletonRow) => (
          <div
            key={skeletonRow}
            className="relative grid gap-4 rounded-sm border border-dashed border-[#D8D3CC] bg-white p-4"
          >
            {showMobileTopAction && (
              <Skeleton
                className={cn(
                  "absolute top-4 right-4 bg-muted",
                  isSelectionMode ? "size-4" : "size-9"
                )}
              />
            )}
            <div className="flex items-start gap-4">
              <Skeleton className="aspect-[63/88] w-20 shrink-0 bg-muted" />
              <div
                className={cn("grid flex-1 gap-2", isSelectionMode && "pr-10")}
              >
                <Skeleton className="h-3 w-20 bg-muted" />
                <Skeleton className="h-5 w-28 bg-muted" />
                <Skeleton className="h-5 w-24 bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
              </div>
            </div>
            {showMobileBottomAction && (
              <Skeleton className="h-9 w-full bg-muted" />
            )}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-[#D8D3CC] bg-card md:block">
        <div
          className={`grid min-w-[62rem] items-center bg-[#ECE9E4] px-3 py-3 ${
            isSelectionMode
              ? selectableListSkeletonDesktopGridClassName
              : listSkeletonDesktopGridClassName
          }`}
        >
          {skeletonColumns.map((skeletonColumn) => (
            <Skeleton
              key={skeletonColumn}
              className="h-3 w-2/3 bg-muted-foreground/20"
            />
          ))}
        </div>
        <div>
          {skeletonRows.map((skeletonRow) => (
            <div
              key={skeletonRow}
              className={`grid min-w-[62rem] items-center border-t border-dashed border-[#D8D3CC] px-3 py-3 odd:bg-white even:bg-[#F4F1EC] ${
                isSelectionMode
                  ? selectableListSkeletonDesktopGridClassName
                  : listSkeletonDesktopGridClassName
              }`}
            >
              {isSelectionMode && <Skeleton className="size-4 bg-muted" />}
              <div className="flex items-center gap-3">
                <Skeleton className="aspect-[63/88] w-[70px] shrink-0 bg-muted" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                  <Skeleton className="h-3 w-4/5 bg-muted" />
                </div>
              </div>
              {skeletonColumns
                .slice(isSelectionMode ? 2 : 1)
                .map((skeletonColumn) => (
                  <Skeleton
                    key={`${skeletonRow}-${skeletonColumn}`}
                    className="h-4 w-3/4 bg-muted"
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
