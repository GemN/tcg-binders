import { useCallback, useEffect, useRef, useState } from "react";

import type { CartItem } from "@/lib/cart";

const cartNoticeVisibleDurationMs = 2500;
const cartNoticeExitDurationMs = 200;

interface UseNavbarCartNoticeParams {
  lastAddedCartItem: CartItem | null;
  onDismissLastAddedCartItem: () => void;
}

interface UseNavbarCartNoticeResult {
  cartNoticeProgress: number;
  closeCartNotice: () => void;
  displayedCartItem: CartItem | null;
  isCartNoticeVisible: boolean;
  pauseCartNotice: () => void;
  resumeCartNotice: () => void;
}

export const useNavbarCartNotice = ({
  lastAddedCartItem,
  onDismissLastAddedCartItem,
}: UseNavbarCartNoticeParams): UseNavbarCartNoticeResult => {
  const [displayedCartItem, setDisplayedCartItem] = useState<CartItem | null>(
    null
  );
  const [isCartNoticeVisible, setIsCartNoticeVisible] = useState(false);
  const [cartNoticeProgress, setCartNoticeProgress] = useState(1);
  const animationFrameRef = useRef<number | null>(null);
  const progressAnimationFrameRef = useRef<number | null>(null);
  const visibleTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);
  const remainingVisibleDurationRef = useRef(cartNoticeVisibleDurationMs);
  const visibleCountdownStartedAtRef = useRef<number | null>(null);

  const clearCartNoticeTimers = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (progressAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(progressAnimationFrameRef.current);
      progressAnimationFrameRef.current = null;
    }

    if (visibleTimeoutRef.current !== null) {
      window.clearTimeout(visibleTimeoutRef.current);
      visibleTimeoutRef.current = null;
    }

    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    visibleCountdownStartedAtRef.current = null;
  }, []);

  const closeCartNotice = useCallback(() => {
    clearCartNoticeTimers();
    setIsCartNoticeVisible(false);
    setCartNoticeProgress(0);

    exitTimeoutRef.current = window.setTimeout(() => {
      onDismissLastAddedCartItem();
      setDisplayedCartItem(null);
      exitTimeoutRef.current = null;
    }, cartNoticeExitDurationMs);
  }, [clearCartNoticeTimers, onDismissLastAddedCartItem]);

  const updateCartNoticeProgress = useCallback(() => {
    const startedAt = visibleCountdownStartedAtRef.current;
    if (startedAt === null) return;

    const elapsedDuration = performance.now() - startedAt;
    const remainingDuration = Math.max(
      0,
      remainingVisibleDurationRef.current - elapsedDuration
    );

    setCartNoticeProgress(remainingDuration / cartNoticeVisibleDurationMs);

    if (remainingDuration > 0 && visibleTimeoutRef.current !== null) {
      progressAnimationFrameRef.current = window.requestAnimationFrame(
        updateCartNoticeProgress
      );
      return;
    }

    progressAnimationFrameRef.current = null;
  }, []);

  const startCartNoticeCountdown = useCallback(
    (durationMs: number) => {
      if (durationMs <= 0) {
        closeCartNotice();
        return;
      }

      remainingVisibleDurationRef.current = durationMs;
      visibleCountdownStartedAtRef.current = performance.now();
      setCartNoticeProgress(durationMs / cartNoticeVisibleDurationMs);

      visibleTimeoutRef.current = window.setTimeout(
        closeCartNotice,
        durationMs
      );
      progressAnimationFrameRef.current = window.requestAnimationFrame(
        updateCartNoticeProgress
      );
    },
    [closeCartNotice, updateCartNoticeProgress]
  );

  const pauseCartNotice = useCallback(() => {
    const startedAt = visibleCountdownStartedAtRef.current;
    if (startedAt === null) return;

    if (visibleTimeoutRef.current !== null) {
      window.clearTimeout(visibleTimeoutRef.current);
      visibleTimeoutRef.current = null;
    }

    if (progressAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(progressAnimationFrameRef.current);
      progressAnimationFrameRef.current = null;
    }

    const elapsedDuration = performance.now() - startedAt;
    const remainingDuration = Math.max(
      0,
      remainingVisibleDurationRef.current - elapsedDuration
    );

    remainingVisibleDurationRef.current = remainingDuration;
    visibleCountdownStartedAtRef.current = null;
    setCartNoticeProgress(remainingDuration / cartNoticeVisibleDurationMs);
  }, []);

  const resumeCartNotice = useCallback(() => {
    if (!isCartNoticeVisible || visibleCountdownStartedAtRef.current !== null) {
      return;
    }

    startCartNoticeCountdown(remainingVisibleDurationRef.current);
  }, [isCartNoticeVisible, startCartNoticeCountdown]);

  useEffect(() => {
    clearCartNoticeTimers();

    if (!lastAddedCartItem) {
      setIsCartNoticeVisible(false);
      setDisplayedCartItem(null);
      setCartNoticeProgress(1);
      return;
    }

    remainingVisibleDurationRef.current = cartNoticeVisibleDurationMs;
    setCartNoticeProgress(1);
    setDisplayedCartItem(lastAddedCartItem);
    setIsCartNoticeVisible(false);

    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsCartNoticeVisible(true);
      animationFrameRef.current = null;
      startCartNoticeCountdown(cartNoticeVisibleDurationMs);
    });

    return clearCartNoticeTimers;
  }, [clearCartNoticeTimers, lastAddedCartItem, startCartNoticeCountdown]);

  return {
    cartNoticeProgress,
    closeCartNotice,
    displayedCartItem,
    isCartNoticeVisible,
    pauseCartNotice,
    resumeCartNotice,
  };
};
