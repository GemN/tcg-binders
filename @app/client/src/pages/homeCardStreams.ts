export type ThreeStreams<T> = [T[], T[], T[]];

const HOME_STREAM_SEEDS = [0x9e3779b9, 0x243f6a88, 0xb7e15162] as const;

const shuffleWithSeed = <T>(items: readonly T[], seed: number): T[] => {
  const shuffledItems = [...items];
  let randomState = seed;

  const getNextRandom = () => {
    randomState += 0x6d2b79f5;
    let randomValue = randomState;
    randomValue = Math.imul(
      randomValue ^ (randomValue >>> 15),
      randomValue | 1
    );
    randomValue ^=
      randomValue +
      Math.imul(randomValue ^ (randomValue >>> 7), randomValue | 61);

    return ((randomValue ^ (randomValue >>> 14)) >>> 0) / 4294967296;
  };

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(getNextRandom() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [
      shuffledItems[swapIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
};

export const createThreeShuffledStreams = <T>(
  items: readonly T[]
): ThreeStreams<T> => {
  return [
    shuffleWithSeed(items, HOME_STREAM_SEEDS[0]),
    shuffleWithSeed(items, HOME_STREAM_SEEDS[1]),
    shuffleWithSeed(items, HOME_STREAM_SEEDS[2]),
  ];
};
