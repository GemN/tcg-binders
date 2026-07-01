import { Link } from "react-router";

import { getCardImageUrls } from "@/lib/cardImageUrl";

interface BinderGalleryBinder {
  coverImageUrl?: string | null;
  coverScryfallId?: string | null;
  id: string;
  name: string;
  shortId: string;
}

interface BinderGalleryProps {
  binders: BinderGalleryBinder[];
}

export const BinderGallery = ({ binders }: BinderGalleryProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {binders.map((binder) => (
        <BinderGalleryItem key={binder.id} binder={binder} />
      ))}
    </div>
  );
};

interface BinderGalleryItemProps {
  binder: BinderGalleryBinder;
}

const BinderGalleryItem = ({ binder }: BinderGalleryItemProps) => {
  const coverImageUrls = getCardImageUrls(
    binder.coverImageUrl,
    "art",
    binder.coverScryfallId
  );

  return (
    <Link
      to={`/binder/${binder.shortId}`}
      className="group grid gap-2"
      aria-label={binder.name}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-foreground ring-1 ring-card/20 transition-transform group-hover:-translate-y-1 group-hover:shadow-lg">
        {coverImageUrls.fallbackUrl && (
          <picture className="absolute inset-0 block">
            {coverImageUrls.webpUrl && (
              <source srcSet={coverImageUrls.webpUrl} type="image/webp" />
            )}
            <img
              src={coverImageUrls.fallbackUrl}
              alt=""
              className="h-full w-full object-cover"
              decoding="async"
              loading="lazy"
            />
          </picture>
        )}
        <div className="absolute inset-x-3 bottom-3  text-center">
          <div className="rounded-sm bg-foreground/80 px-4 py-2 inline-block">
            <div className="line-clamp-2 text-center text-sm font-semibold leading-5 text-white">
              {binder.name}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
