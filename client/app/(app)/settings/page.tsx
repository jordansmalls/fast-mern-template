"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  useAuthStore,
  useDeleteAccount,
  useUpdateAccount,
} from "@/src/hooks/useAuth"
import { API_URL, useHealth } from "@/src/hooks/useHealth"

function Feedback({ error, message }: { error: unknown; message?: string }) {
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {getErrorMessage(error)}
      </p>
    )
  return message ? (
    <p role="status" className="text-sm text-muted-foreground">
      {message}
    </p>
  ) : null
}

function EmailForm({ email }: { email: string }) {
  const mutation = useUpdateAccount()
  const busy = useAuthBusy()
  const [value, setValue] = useState(email)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    try {
      await mutation.mutateAsync({ email: value.trim() })
    } catch {}
  }
  return (
    <form onSubmit={submit} className="max-w-md" aria-busy={mutation.isPending}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="account-email">Email address</FieldLabel>
          <Input
            id="account-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              mutation.reset()
            }}
            disabled={busy}
          />
        </Field>
        <Feedback error={null} message={mutation.data?.message} />
        <Button
          type="submit"
          className="w-fit"
          disabled={busy || value.trim().toLowerCase() === email}
        >
          {mutation.isPending ? "Saving…" : "Update email"}
        </Button>
      </FieldGroup>
    </form>
  )
}

function PasswordForm() {
  const mutation = useUpdateAccount()
  const busy = useAuthBusy()
  const [validation, setValidation] = useState("")
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const data = new FormData(form)
    const password = String(data.get("password"))
    if (password !== data.get("confirmPassword")) {
      setValidation("Passwords do not match.")
      return
    }
    setValidation("")
    try {
      await mutation.mutateAsync({ password })
      form.reset()
    } catch {}
  }
  return (
    <form onSubmit={submit} className="max-w-md" aria-busy={mutation.isPending}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <Input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={busy}
            aria-describedby="new-password-hint"
            onChange={() => mutation.reset()}
          />
          <FieldDescription id="new-password-hint">
            Use at least 8 characters.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">
            Confirm new password
          </FieldLabel>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={busy}
            onChange={() => setValidation("")}
          />
        </Field>
        {validation && (
          <p role="alert" className="text-sm text-destructive">
            {validation}
          </p>
        )}
        <Feedback error={null} message={mutation.data?.message} />
        <Button type="submit" className="w-fit" disabled={busy}>
          {mutation.isPending ? "Saving…" : "Update password"}
        </Button>
      </FieldGroup>
    </form>
  )
}

function DeleteAccount() {
  const mutation = useDeleteAccount()
  const busy = useAuthBusy()
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  return (
    <Card className="ring-destructive/25">
      <CardHeader>
        <CardTitle>
          <h2>Delete account</h2>
        </CardTitle>
        <CardDescription>
          Permanently delete your account and sign out. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-w-lg space-y-4">
        {!confirming ? (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            Delete account
          </Button>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!busy && confirmation === "DELETE") mutation.mutate()
            }}
          >
            <Field>
              <FieldLabel htmlFor="delete-confirmation">
                Type DELETE to confirm
              </FieldLabel>
              <Input
                id="delete-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                disabled={busy}
                required
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={busy || confirmation !== "DELETE"}
              >
                {mutation.isPending
                  ? "Deleting…"
                  : "Permanently delete account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setConfirming(false)
                  setConfirmation("")
                  mutation.reset()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function ApiConnection() {
  const health = useHealth()
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>API connection</h2>
        </CardTitle>
        <CardDescription>
          The server this app uses for your account and data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">API URL</p>
          <code className="block rounded-md bg-muted px-3 py-2 text-sm break-all">
            {API_URL}
          </code>
          <p className="text-xs leading-relaxed text-muted-foreground">
            To connect another API, set NEXT_PUBLIC_API_URL in .env.local and
            restart the client.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            disabled={health.isFetching}
            onClick={() => void health.refetch()}
          >
            {health.isFetching ? "Testing…" : "Test connection"}
          </Button>
          <p role="status" className="text-sm text-muted-foreground">
            {health.isError
              ? "Connection failed"
              : health.data
                ? health.data.database === "connected"
                  ? "API and database connected"
                  : "API reachable; database disconnected"
                : "Checking connection…"}
          </p>
        </div>
        <Feedback error={health.error} />
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and API connection.
        </p>
      </div>
      <ApiConnection />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Email</h2>
          </CardTitle>
          <CardDescription>
            Change the email you use to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>{user && <EmailForm email={user.email} />}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Password</h2>
          </CardTitle>
          <CardDescription>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
      <DeleteAccount />
    </>
  )
}
