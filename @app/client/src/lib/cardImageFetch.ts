const MAX_CONCURRENT_IMAGE_REQUESTS = 4;
const MIN_SCRYFALL_API_REQUEST_INTERVAL_MS = 110;
const MAX_RATE_LIMIT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1000;

interface CardImageFetchAttemptResult {
  blob: Blob | null;
  retryAfter: string | null;
}

interface QueuedCardImageRequest {
  operation: () => Promise<CardImageFetchAttemptResult>;
  reject: (error: unknown) => void;
  resolve: (result: CardImageFetchAttemptResult) => void;
  requestInterval: number;
  signal: AbortSignal;
  onAbort: () => void;
}

const queuedRequests: QueuedCardImageRequest[] = [];
let activeRequestCount = 0;
let nextRateLimitedRequestStartTime = 0;
let queueTimer: ReturnType<typeof setTimeout> | null = null;

const getAbortError = (): DOMException => {
  return new DOMException("Image request aborted.", "AbortError");
};

const processRequestQueue = (): void => {
  if (
    queueTimer !== null ||
    activeRequestCount >= MAX_CONCURRENT_IMAGE_REQUESTS
  ) {
    return;
  }

  const queuedRequest = queuedRequests[0];
  if (!queuedRequest) return;

  const startDelay =
    queuedRequest.requestInterval > 0
      ? Math.max(nextRateLimitedRequestStartTime - Date.now(), 0)
      : 0;
  if (startDelay > 0) {
    queueTimer = setTimeout(() => {
      queueTimer = null;
      processRequestQueue();
    }, startDelay);
    return;
  }

  queuedRequests.shift();
  queuedRequest.signal.removeEventListener("abort", queuedRequest.onAbort);
  activeRequestCount += 1;
  if (queuedRequest.requestInterval > 0) {
    nextRateLimitedRequestStartTime =
      Date.now() + queuedRequest.requestInterval;
  }

  void queuedRequest
    .operation()
    .then(queuedRequest.resolve, queuedRequest.reject)
    .finally(() => {
      activeRequestCount -= 1;
      processRequestQueue();
    });

  processRequestQueue();
};

const enqueueCardImageRequest = (
  operation: () => Promise<CardImageFetchAttemptResult>,
  requestInterval: number,
  signal: AbortSignal
): Promise<CardImageFetchAttemptResult> => {
  if (signal.aborted) return Promise.reject(getAbortError());

  return new Promise((resolve, reject) => {
    const queuedRequest: QueuedCardImageRequest = {
      operation,
      reject,
      requestInterval,
      resolve,
      signal,
      onAbort: () => {
        const requestIndex = queuedRequests.indexOf(queuedRequest);
        if (requestIndex === -1) return;

        queuedRequests.splice(requestIndex, 1);
        reject(getAbortError());
        processRequestQueue();
      },
    };

    signal.addEventListener("abort", queuedRequest.onAbort, { once: true });
    queuedRequests.push(queuedRequest);
    processRequestQueue();
  });
};

const getRetryDelay = (retryAfter: string | null): number => {
  if (!retryAfter) return DEFAULT_RETRY_DELAY_MS;

  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds)) {
    return Math.max(retryAfterSeconds * 1000, 0);
  }

  const retryDate = Date.parse(retryAfter);
  return Number.isNaN(retryDate)
    ? DEFAULT_RETRY_DELAY_MS
    : Math.max(retryDate - Date.now(), 0);
};

const waitForRetry = (
  duration: number,
  signal: AbortSignal
): Promise<void> => {
  if (signal.aborted) return Promise.reject(getAbortError());

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, duration);
    const handleAbort = () => {
      clearTimeout(timer);
      reject(getAbortError());
    };

    signal.addEventListener("abort", handleAbort, { once: true });
  });
};

export const fetchCardImageBlob = async (
  imageUrl: string,
  signal: AbortSignal
): Promise<Blob> => {
  const requestInterval = imageUrl.startsWith("https://api.scryfall.com/")
    ? MIN_SCRYFALL_API_REQUEST_INTERVAL_MS
    : 0;

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    const result = await enqueueCardImageRequest(async () => {
      const response = await fetch(imageUrl, { signal });

      if (response.status === 429) {
        return {
          blob: null,
          retryAfter: response.headers.get("Retry-After"),
        };
      }

      if (!response.ok) {
        throw new Error(`Image request failed: ${response.status}`);
      }

      return {
        blob: await response.blob(),
        retryAfter: null,
      };
    }, requestInterval, signal);

    if (result.blob) return result.blob;
    if (attempt === MAX_RATE_LIMIT_RETRIES) break;

    await waitForRetry(getRetryDelay(result.retryAfter), signal);
  }

  throw new Error("Image request failed after rate-limit retries.");
};
