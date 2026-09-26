"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CommandIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  getErrorMessage,
  useAuthBusy,
  useEmailAvailable,
  useLogin,
  useSignup,
} from "@/src/hooks/useAuth"
import { cn } from "@/lib/utils"

export function AuthForm({
  mode,
  className,
  ...props
}: React.ComponentProps<"div"> & { mode: "login" | "signup" }) {
  const signup = mode === "signup"
  const loginMutation = useLogin()
  const signupMutation = useSignup()
  const mutation = signup ? signupMutation : loginMutation
  const busy = useAuthBusy()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [checkedEmail, setCheckedEmail] = useState("")
  const [validation, setValidation] = useState("")
  const availability = useEmailAvailable(checkedEmail, signup && !!checkedEmail)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password"))
    if (signup && password !== form.get("confirmPassword")) {
      setValidation("Passwords do not match.")
      return
    }
    setValidation("")
    try {
      await mutation.mutateAsync({ email: email.trim(), password })
      // Only allow known app routes, never a user-provided external redirect.
      const next = new URLSearchParams(window.location.search).get("next")
      router.replace(next === "/settings" ? "/settings" : "/")
    } catch {
      // The shared mutation cache displays the API error in a toast.
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href="/" aria-label="Acme home">
          <CommandIcon className="size-8" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {signup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {signup ? "Get started with Acme." : "Sign in to your Acme account."}
        </p>
      </div>
      <form onSubmit={submit} aria-busy={busy}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              required
              disabled={busy}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setCheckedEmail("")
                mutation.reset()
              }}
              onBlur={(event) => {
                if (event.target.validity.valid) setCheckedEmail(email.trim())
              }}
              aria-describedby={signup ? "email-availability" : undefined}
            />
            {signup && (
              <p
                id="email-availability"
                role="status"
                className={`text-xs ${availability.data?.available === false ? "text-destructive" : "text-muted-foreground"}`}
              >
                {checkedEmail
                  ? availability.isFetching
                    ? "Checking email…"
                    : availability.isError
                      ? getErrorMessage(availability.error)
                      : availability.data?.message
                  : "Use an email address you can access."}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={8}
              required
              disabled={busy}
              aria-describedby={signup ? "password-hint" : undefined}
            />
            {signup && (
              <FieldDescription id="password-hint">
                Use at least 8 characters.
              </FieldDescription>
            )}
          </Field>
          {signup && (
            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm password
              </FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={busy}
                onChange={() => setValidation("")}
              />
            </Field>
          )}
          {validation && (
            <p role="alert" className="text-sm text-destructive">
              {validation}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy}>
            {mutation.isPending
              ? signup
                ? "Creating account…"
                : "Signing in…"
              : signup
                ? "Create account"
                : "Sign in"}
          </Button>
        </FieldGroup>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {signup ? "Already have an account? " : "Don't have an account? "}
        <Link
          href={signup ? "/login" : "/signup"}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {signup ? "Sign in" : "Sign up"}
        </Link>
      </p>
      <FieldDescription className="text-center">
        By continuing, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  )
}
