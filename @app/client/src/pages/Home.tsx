import {
  type CardSearchFieldsFragment,
  useCardsForBinderImportQuery,
} from "@app/graphql";
import { Upload } from "lucide-react";
import { type CSSProperties, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

import { ButtonImportBinder } from "@/components/ButtonImportBinder";
import { CardImage } from "@/components/CardImage";
import { CardSearchPicker } from "@/components/CardSearchPicker";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/Button";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import { useDraftBinder } from "@/hooks/useDraftBinder";
import {
  type BinderEditingCardSnapshot,
  presentBinderEditingError,
} from "@/lib/binderEditing";
import { getCardScryfallId } from "@/lib/cardImageUrl";
import { SEO_BRAND, type SeoMetadata } from "@/lib/seoMetadata";
import { cn } from "@/lib/utils";

import { createHomeJsonLd } from "./Home.jsonLd";
import { createThreeShuffledStreams } from "./homeCardStreams";

const HOME_CARD_IDS = [
  "7ef36f72-a7f9-4d03-9d27-1a6c9da8647f",
  "4f40b1b9-bbad-4d58-b573-c058e2339530",
  "55f16109-e69b-41d5-a324-440bb8490f9e",
  "5c90d064-9d5c-4b64-92d4-0780d338d3fb",
  "059722ed-076e-4d1a-8bfa-90e343f6753c",
  "09a40d42-166e-4bd3-a46d-12013ad373a5",
  "07c0216b-24d1-48f8-933d-6a3dfcf0e573",
  "367e7b50-6e4f-4f30-8728-4c6b4ac0f744",
  "9ea29dfb-6eb2-487e-8e5a-0a5cb230c79d",
  "b0b3f1a2-4289-4163-abe9-7819bb6f9fbc",
  "9eda3545-dd52-45ea-a03b-567eb2b3f644",
] as const;
const RANDOM_MOBILE_HOME_CARD_ID =
  HOME_CARD_IDS[Math.floor(Math.random() * HOME_CARD_IDS.length)] ??
  HOME_CARD_IDS[0];
const HOME_CARD_TRACK_CLASS_NAME =
  "flex flex-col bg-transparent will-change-transform motion-reduce:animate-none";
const HOME_CARD_SEQUENCE_CLASS_NAME =
  "flex flex-none flex-col gap-[clamp(1.25rem,2vw,2rem)] " +
  "bg-transparent pb-[clamp(1.25rem,2vw,2rem)]";

interface HomeCardLinkProps {
  card: CardSearchFieldsFragment;
  className?: string;
  growsNearCenter?: boolean;
}

const HomeCardLink = ({
  card,
  className,
  growsNearCenter,
}: HomeCardLinkProps) => {
  return (
    <Link
      aria-hidden="true"
      className={
        "home-card-link relative block origin-center cursor-pointer " +
        "rounded-[4.75%_/_3.5%] transition-[transform,box-shadow] " +
        "duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] " +
        "will-change-transform hover:z-20 " +
        "motion-reduce:transition-none " +
        (className || "")
      }
      data-home-growing-card={growsNearCenter || undefined}
      tabIndex={-1}
      to={`/card/${card.id}`}
    >
      <CardImage
        alt=""
        className="w-full"
        finish={null}
        imageSize="grid"
        imageUrl={card.imageUrl}
        noImageLabel=""
        showBadgeFinish={false}
        scryfallId={getCardScryfallId(card)}
      />
      <span
        aria-hidden="true"
        className={
          "home-card-holographic-overlay pointer-events-none absolute inset-0 " +
          "rounded-[inherit] opacity-0 mix-blend-screen transition-opacity " +
          "duration-150 ease-out motion-reduce:transition-none"
        }
      />
    </Link>
  );
};

interface HomeCardLaneProps {
  animationClassName: string;
  cards: readonly CardSearchFieldsFragment[];
  growCardsNearCenter?: boolean;
  positionClassName: string;
  rotationClassName: string;
  secondsPerCard: number;
}

const HomeCardLane = ({
  animationClassName,
  cards,
  growCardsNearCenter = false,
  positionClassName,
  rotationClassName,
  secondsPerCard,
}: HomeCardLaneProps) => {
  const laneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!growCardsNearCenter || !laneRef.current) return;

    const growingCards = Array.from(
      laneRef.current.querySelectorAll<HTMLElement>("[data-home-growing-card]")
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const streamVisibility = window.matchMedia(
      "(min-width: 1200px) and (min-aspect-ratio: 8/5) and (max-height: 1200px)"
    );
    let animationFrameId: number | undefined;

    const resetCardWidths = () => {
      growingCards.forEach((card) => {
        card.style.width = "100%";
      });
    };

    const handleAnimationFrame = () => {
      const viewportCenter = window.innerHeight / 2;
      const sequenceCardCount = growingCards.length / 2;
      const cardRects = growingCards.map((card) =>
        card.getBoundingClientRect()
      );
      const widths = cardRects
        .slice(0, sequenceCardCount)
        .map((cardRect, cardIndex) => {
          const duplicateRect = cardRects[cardIndex + sequenceCardCount];
          const centerProximity = Math.max(
            ...[cardRect, duplicateRect].map((rect) => {
              const cardCenter = rect.top + rect.height / 2;

              return Math.max(
                0,
                1 - Math.abs(cardCenter - viewportCenter) / viewportCenter
              );
            })
          );

          return `${(1 + 0.25 * centerProximity) * 100}%`;
        });

      growingCards.forEach((card, index) => {
        card.style.width = widths[index % sequenceCardCount];
      });

      animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
    };

    const handleAnimationStateChange = () => {
      if (reducedMotion.matches || !streamVisibility.matches) {
        if (animationFrameId !== undefined) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = undefined;
        }
        resetCardWidths();
        return;
      }

      if (animationFrameId === undefined) {
        animationFrameId = window.requestAnimationFrame(handleAnimationFrame);
      }
    };

    reducedMotion.addEventListener("change", handleAnimationStateChange);
    streamVisibility.addEventListener("change", handleAnimationStateChange);
    handleAnimationStateChange();

    return () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
      }
      resetCardWidths();
      reducedMotion.removeEventListener("change", handleAnimationStateChange);
      streamVisibility.removeEventListener(
        "change",
        handleAnimationStateChange
      );
    };
  }, [cards.length, growCardsNearCenter]);

  if (cards.length === 0) return null;

  const trackStyle: CSSProperties = {
    animationDuration: `${cards.length * secondsPerCard}s`,
  };

  return (
    <div
      className={
        `home-card-lane relative min-w-0 origin-top ${positionClassName} ${rotationClassName} ` +
        "overflow-visible bg-transparent " +
        (growCardsNearCenter ? "z-10" : "")
      }
      ref={laneRef}
    >
      <div
        className={`${HOME_CARD_TRACK_CLASS_NAME} ${animationClassName}`}
        style={trackStyle}
      >
        {[0, 1].map((sequence) => (
          <div className={HOME_CARD_SEQUENCE_CLASS_NAME} key={sequence}>
            {cards.map((card, cardIndex) => (
              <HomeCardLink
                card={card}
                className={
                  "w-full flex-none " +
                  (growCardsNearCenter ? "ml-auto will-change-[width]" : "")
                }
                growsNearCenter={growCardsNearCenter}
                key={`${sequence}-${cardIndex}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface HomeCardStreamsProps {
  cards: readonly CardSearchFieldsFragment[];
}

const HomeCardStreams = ({ cards }: HomeCardStreamsProps) => {
  const [firstStreamCards, secondStreamCards, thirdStreamCards] =
    createThreeShuffledStreams(cards);

  return (
    <div
      className={
        "absolute -top-14 right-0 -bottom-14 z-[1] hidden " +
        "w-[min(45vw,42rem)] grid-cols-3 " +
        "gap-[clamp(1rem,2vw,2rem)] overflow-visible bg-transparent px-6 " +
        "[@media(min-width:1200px)_and_(min-aspect-ratio:8/5)_and_(max-height:1200px)]:grid"
      }
    >
      <HomeCardLane
        animationClassName={
          "animate-[home-cards-down_linear_infinite] " +
          "[animation-delay:-12s] motion-reduce:-translate-y-[18%]"
        }
        cards={firstStreamCards}
        growCardsNearCenter
        positionClassName="translate-x-11 translate-y-0"
        rotationClassName="rotate-[10deg]"
        secondsPerCard={8.5}
      />
      <HomeCardLane
        animationClassName={
          "animate-[home-cards-up_linear_infinite] " +
          "[animation-delay:-24s] motion-reduce:-translate-y-[36%]"
        }
        cards={secondStreamCards}
        positionClassName="translate-x-0 translate-y-0"
        rotationClassName="rotate-[3deg]"
        secondsPerCard={9.5}
      />
      <HomeCardLane
        animationClassName={
          "animate-[home-cards-down_linear_infinite] " +
          "[animation-delay:-4s] motion-reduce:-translate-y-[8%]"
        }
        cards={thirdStreamCards}
        positionClassName="-translate-x-10 translate-y-0"
        rotationClassName="rotate-[-3deg]"
        secondsPerCard={8.5}
      />
    </div>
  );
};

export const Home = () => {
  const { t } = useTranslation(["common", "binder"]);
  const navigate = useNavigate();
  const { binderEditing, draftBinder } = useDraftBinder();
  const { data } = useCardsForBinderImportQuery({
    variables: {
      filter: { id: { in: [...HOME_CARD_IDS] } },
      first: HOME_CARD_IDS.length,
    },
  });
  const homeCardsById = new Map(
    data?.cardsCollection?.edges.map(({ node }) => [node.id, node])
  );
  const homeCards = HOME_CARD_IDS.flatMap((cardId) => {
    const card = homeCardsById.get(cardId);

    return card ? [card] : [];
  });
  const mobileHomeCard =
    homeCardsById.get(RANDOM_MOBILE_HOME_CARD_ID) ?? homeCards[0];
  const description = t("common:seo.home.description");
  const seoMetadata: SeoMetadata = {
    canonicalPath: "/",
    description,
    jsonLd: createHomeJsonLd({
      description,
      name: SEO_BRAND,
    }),
    robots: "index,follow",
    title: t("common:seo.home.title"),
  };

  const handleCardSelect = async (card: BinderEditingCardSnapshot) => {
    try {
      await binderEditing.addCard({ card });
      navigate("/binder/draft");
    } catch (error) {
      presentBinderEditingError(error, {
        fallbackMessage: t("binder:add_card_error"),
      });
    }
  };

  const handleImported = () => navigate("/binder/draft");

  return (
    <div
      className={
        "relative isolate min-h-[calc(100svh-3.5rem)] w-screen max-w-[100vw] lg:min-h-svh " +
        "overflow-hidden bg-background bg-[url('/bg-home.jpg')] " +
        "bg-cover bg-center"
      }
    >
      <Seo metadata={seoMetadata} />
      <HomeCardStreams cards={homeCards} />
      <div
        className={cn(
          "pointer-events-none relative z-[2] box-border flex min-h-[calc(100svh-3.5rem)] w-full max-w-[100vw] min-w-0 px-4 sm:px-8 lg:min-h-svh",
          NAVBAR_CONTENT_OFFSET_CLASS_NAME
        )}
      >
        <div className="grid w-full min-w-0 items-start max-w-[671px] pt-10 sm:items-center sm:pt-0">
          <div className="pointer-events-auto">
            <div className="mb-6 flex items-center sm:hidden">
              {mobileHomeCard && (
                <HomeCardLink
                  card={mobileHomeCard}
                  className={
                    "home-mobile-featured-card aspect-[63/88] w-[120px] ml-2 " +
                    "rotate-6 shadow-xl shadow-black/25"
                  }
                />
              )}
            </div>
            <h1 className="text-left font-display text-[32px] leading-[1.05] font-medium text-white sm:text-5xl sm:leading-[normal] lg:text-[64px]">
              {t("common:home.title")}
            </h1>
            <p className="mt-2 text-base text-white/80">
              {t("common:home.subtitle")}
            </p>

            <div className="mt-4 flex w-full max-w-full flex-col gap-2 sm:mt-10 sm:flex-row sm:items-start sm:gap-4">
              <CardSearchPicker
                containerClassName="z-10 min-w-0 max-w-[420px] w-full"
                className="h-11 border-white/25 bg-white/95 px-4 pl-10 shadow-lg shadow-black/15 "
                iconClassName="left-3.5 text-primary/55"
                onSelect={handleCardSelect}
              />

              <div className="flex items-center justify-start text-base text-white/70 sm:h-11 sm:justify-center">
                {t("common:home.or")}
              </div>

              <ButtonImportBinder
                binderEditing={binderEditing}
                tcgId={draftBinder.tcgId}
                onImported={handleImported}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-fit shrink-0 border-white/35 bg-white/95 px-5 shadow-lg shadow-black/15"
                  >
                    <Upload className="size-4" />
                    {t("common:home.import_from_file")}
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
