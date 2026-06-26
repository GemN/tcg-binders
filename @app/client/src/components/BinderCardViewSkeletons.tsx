import { Skeleton } from "@/components/ui/Skeleton";

const LIST_SKELETON_COLUMN_COUNT = 9;

export const BinderCardGridSkeleton = ({ count }: { count: number }) => {
  const skeletonItems = Array.from(
    { length: count },
    (_, index) => `grid-skeleton-${index}`
  );

  return (
    <div className="grid h-full grid-cols-2 place-items-start content-start gap-2 gap-y-4 sm:grid-cols-4 lg:grid-cols-7">
      {skeletonItems.map((skeletonItem) => (
        <Skeleton
          key={skeletonItem}
          className="aspect-[63/88] w-full max-w-[12rem] rounded-md bg-binder-toolbar/25"
        />
      ))}
    </div>
  );
};

export const BinderCardListSkeleton = ({ count }: { count: number }) => {
  const skeletonColumns = Array.from(
    { length: LIST_SKELETON_COLUMN_COUNT },
    (_, index) => `list-skeleton-column-${index}`
  );
  const skeletonRows = Array.from(
    { length: count },
    (_, index) => `list-skeleton-row-${index}`
  );

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="grid grid-cols-[5rem_5rem_minmax(15rem,1fr)_4rem_6rem_repeat(4,minmax(7rem,1fr))] gap-0 bg-muted/70 px-3 py-3">
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
            className="grid grid-cols-[5rem_5rem_minmax(15rem,1fr)_4rem_6rem_repeat(4,minmax(7rem,1fr))] gap-0 border-t border-border px-3 py-3 odd:bg-card even:bg-muted/25"
          >
            {skeletonColumns.map((skeletonColumn) => (
              <Skeleton
                key={`${skeletonRow}-${skeletonColumn}`}
                className="h-4 w-3/4 bg-muted"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
