import { useCallback } from "react";
import { errorToast } from "@/shared/toasts/errorToast";
import { successToast } from "@/shared/toasts/successToast";

export interface ConfirmDeleteOptions {
  /** Toast shown after the action resolves. Omit for no success toast. */
  successMessage?: string;
  /** Fallback error toast when the thrown error has no message. */
  errorMessage?: string;
  /** Run after a successful delete (e.g. reload a page or filter local state). */
  onSuccess?: () => void | Promise<void>;
}

/**
 * Standardizes the `window.confirm` → delete → toast flow duplicated across ~22
 * call sites. Returns an async runner:
 *
 *   const confirmDelete = useConfirmDelete();
 *   confirmDelete(`Delete "${item.name}"?`, () => service.delete(item.id), {
 *     successMessage: `"${item.name}" deleted`,
 *     onSuccess: () => loadPage(),
 *   });
 *
 * Resolves to `true` when the delete ran and succeeded, `false` when the user
 * cancelled or the action threw (the error toast is shown automatically).
 */
export function useConfirmDelete() {
  return useCallback(
    async (
      message: string,
      action: () => Promise<unknown>,
      options: ConfirmDeleteOptions = {},
    ): Promise<boolean> => {
      if (!window.confirm(message)) return false;
      try {
        await action();
        if (options.successMessage) successToast(options.successMessage);
        await options.onSuccess?.();
        return true;
      } catch (error: any) {
        errorToast(
          error?.message || options.errorMessage || "Delete failed",
        );
        return false;
      }
    },
    [],
  );
}
