export type CardImageSize = "thumbnail" | "grid" | "detail" | "art";

export interface CardImageUrlCard {
  imageUrl?: string | null;
  mtgCardDetail?: {
    scryfallId?: string | null;
  } | null;
}

interface CardImageSizeConfig {
  fallbackVersion: string;
  webpVersion?: string;
}

export interface CardImageUrls {
  fallbackUrl: string | null;
  preferredUrl: string | null;
  webpUrl: string | null;
}

const cardImageSizeConfigs: Record<CardImageSize, CardImageSizeConfig> = {
  thumbnail: {
    fallbackVersion: "small",
    webpVersion: "thumb",
  },
  grid: {
    fallbackVersion: "normal",
    webpVersion: "grid",
  },
  detail: {
    fallbackVersion: "normal",
    webpVersion: "grid",
  },
  art: {
    fallbackVersion: "art_crop",
  },
};

const scryfallIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const appendScryfallImageVersion = (
  imageUrl: string,
  version: string
): string => {
  try {
    const url = new URL(imageUrl);

    url.searchParams.set("version", version);

    return url.toString();
  } catch {
    const separator = imageUrl.includes("?") ? "&" : "?";

    return `${imageUrl}${separator}version=${version}`;
  }
};

const getScryfallStaticImageUrl = (
  scryfallId: string | null | undefined,
  version: string,
  extension: "jpg" | "webp"
): string | null => {
  const cleanScryfallId = scryfallId?.trim().toLowerCase();

  if (!cleanScryfallId || !scryfallIdPattern.test(cleanScryfallId)) {
    return null;
  }

  return `https://cards.scryfall.io/${version}/front/${cleanScryfallId[0]}/${cleanScryfallId[1]}/${cleanScryfallId}.${extension}`;
};

export const getCardImageBaseUrl = (
  card: CardImageUrlCard | null | undefined
): string | null => card?.imageUrl || null;

export const getCardScryfallId = (
  card: CardImageUrlCard | null | undefined
): string | null => card?.mtgCardDetail?.scryfallId || null;

export const getCardImageUrls = (
  imageUrl: string | null | undefined,
  size: CardImageSize = "grid",
  scryfallId?: string | null
): CardImageUrls => {
  const sourceUrl = imageUrl?.trim();
  const sizeConfig = cardImageSizeConfigs[size];
  const webpUrl = sizeConfig.webpVersion
    ? getScryfallStaticImageUrl(scryfallId, sizeConfig.webpVersion, "webp")
    : null;
  const staticFallbackUrl = getScryfallStaticImageUrl(
    scryfallId,
    sizeConfig.fallbackVersion,
    "jpg"
  );

  if (!sourceUrl && !staticFallbackUrl) {
    return {
      fallbackUrl: null,
      preferredUrl: null,
      webpUrl: null,
    };
  }

  if (staticFallbackUrl) {
    return {
      fallbackUrl: staticFallbackUrl,
      preferredUrl: webpUrl || staticFallbackUrl,
      webpUrl,
    };
  }

  if (sourceUrl?.startsWith("https://api.scryfall.com/")) {
    const fallbackUrl = appendScryfallImageVersion(
      sourceUrl,
      sizeConfig.fallbackVersion
    );

    return {
      fallbackUrl,
      preferredUrl: fallbackUrl,
      webpUrl: null,
    };
  }

  return {
    fallbackUrl: sourceUrl || null,
    preferredUrl: sourceUrl || null,
    webpUrl: null,
  };
};

export const getPreferredCardImageUrl = (
  imageUrl: string | null | undefined,
  size: CardImageSize = "grid",
  scryfallId?: string | null
): string | null => getCardImageUrls(imageUrl, size, scryfallId).preferredUrl;
