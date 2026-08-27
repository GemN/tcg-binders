import { handleError } from "../error.ts";
import {
  type BinderEditingFailureReason,
  isBinderEditingError,
} from "./types.ts";

export interface BinderEditingErrorPresentation {
  fallbackMessage: string;
  reasonMessages?: Partial<Record<BinderEditingFailureReason, string>>;
}

export const getBinderEditingErrorMessage = (
  error: unknown,
  presentation: BinderEditingErrorPresentation
): string => {
  if (isBinderEditingError(error)) {
    return (
      presentation.reasonMessages?.[error.reason] ||
      presentation.fallbackMessage
    );
  }

  return error instanceof Error && error.message
    ? error.message
    : presentation.fallbackMessage;
};

export const presentBinderEditingError = (
  error: unknown,
  presentation: BinderEditingErrorPresentation
): Error => {
  return handleError(
    error,
    getBinderEditingErrorMessage(error, presentation),
    { preferToastError: true }
  );
};
