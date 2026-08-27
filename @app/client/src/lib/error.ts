import { toast } from "sonner";

export interface HandleErrorOptions {
  preferToastError?: boolean;
}

export const handleError = (
  error: Error | unknown,
  toastError?: string,
  options: HandleErrorOptions = {}
) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  console.error(error);
  // Emplacement futur pour l'intégration de Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   // Sentry.captureException(error, { extra: context });
  // }

  const toastMessage = options.preferToastError
    ? toastError || errorObj.message || "An unexpected error occurred"
    : errorObj.message || toastError || "An unexpected error occurred";
  toast.error(toastMessage);
  return errorObj;
};
