"use client"

import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"
import { HealthCard } from "@/components/health-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuthStore } from "@/src/hooks/useAuth"
import { formatDate } from "@/src/lib/format"

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your account and service status at a glance.
        </p>
      </div>
      <HealthCard />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Your account</h2>
          </CardTitle>
          <CardDescription>Details for your current account.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2">
            {[
              ["Email address", user?.email],
              ["Account ID", user?._id],
              ["Created", formatDate(user?.createdAt)],
              ["Last updated", formatDate(user?.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 space-y-1">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm break-all">{value || "Unavailable"}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/settings"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            Manage account <ArrowUpRightIcon className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </>
  )
}
