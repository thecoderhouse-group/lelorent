"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react/ssr";

import { signInWithEmail, type AuthState } from "@/app/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-transform hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:active:translate-y-0"
    >
      {pending ? "Sending link…" : "Email me a sign-in link"}
    </button>
  );
}

export function EmailSignInForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(
    signInWithEmail,
    {},
  );

  if (state.sent) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-primary/40 bg-accent p-4">
        <CheckCircle
          size={18}
          weight="fill"
          className="mt-0.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium text-accent-foreground">
            Check your email
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            We sent you a sign-in link. It expires in an hour and works once.
            Nothing arrives? Check spam, then try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-describedby={state.error ? "email-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          className="h-11 rounded-md border border-input bg-card px-3 text-sm placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.error && (
          <p
            id="email-error"
            role="alert"
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <WarningCircle size={13} aria-hidden="true" />
            {state.error}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
