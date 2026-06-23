import { Link } from "react-router";

interface BinderGalleryBinder {
  coverImageUrl?: string | null;
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
  return (
    <Link
      to={`/binder/${binder.shortId}`}
      className="group grid gap-2"
      aria-label={binder.name}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-foreground shadow-md ring-1 ring-card/20 transition-transform group-hover:-translate-y-1 group-hover:shadow-lg">
        {binder.coverImageUrl && (
          <img
            src={binder.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-foreground/15 via-foreground/20 to-foreground/80" />
        <div className="absolute inset-x-3 bottom-3 rounded-sm border border-card-foreground/15 bg-card/80 px-2 py-2">
          <div className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-card-foreground">
            {binder.name}
          </div>
        </div>
      </div>
    </Link>
  );
};
