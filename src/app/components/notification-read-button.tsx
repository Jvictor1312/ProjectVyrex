"use client";

import { useActionState } from "react";
import { markNotificationReadAction } from "@/app/actions/creator";
import type { FormState } from "@/lib/validation/auth";

const initialState: FormState = { message: "", success: false };

export function NotificationReadButton({
  notificationId,
}: {
  notificationId: string;
}) {
  const [state, action, pending] = useActionState(
    markNotificationReadAction,
    initialState,
  );

  return (
    <form action={action}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <button className="quiet-button" type="submit" disabled={pending}>
        {pending ? "Atualizando..." : "Marcar como lida"}
      </button>
      {state.message && (
        <span className="form-message" role="status" aria-live="polite">
          {state.message}
        </span>
      )}
    </form>
  );
}
