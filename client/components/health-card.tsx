"use client"

import { RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useHealth } from "@/src/hooks/useHealth"
import { getErrorMessage } from "@/src/hooks/useAuth"
import { formatDate, formatUptime } from "@/src/lib/format"

export function HealthCard() {
  const health = useHealth()
  const data = health.data
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>
            <h2>Service status</h2>
          </CardTitle>
          <CardDescription>
            Checks automatically every 30 seconds.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void health.refetch()}
          disabled={health.isFetching}
        >
          <RefreshCwIcon
            className={
              health.isFetching ? "animate-spin motion-reduce:animate-none" : ""
            }
          />
          {health.isFetching ? "Checking…" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5" aria-busy={health.isFetching}>
        {health.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            Checking the service…
          </p>
        )}
        {health.isError && (
          <div
            role="alert"
            className="space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm"
          >
            <p className="font-medium text-destructive">
              Unable to check the service
            </p>
            <p>{getErrorMessage(health.error)}</p>
            {data && (
              <p className="text-muted-foreground">
                Showing the last successful check below.
              </p>
            )}
          </div>
        )}
        {data && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant={
                  health.isError || data.database !== "connected"
                    ? "outline"
                    : "secondary"
                }
              >
                <span
                  className={`size-1.5 rounded-full ${health.isError ? "bg-muted-foreground" : data.database === "connected" ? "bg-emerald-500" : "bg-amber-500"}`}
                />
                {health.isError
                  ? "Last known status"
                  : data.database === "connected"
                    ? "Operational"
                    : "Database unavailable"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {data.message}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {[
                ["Database", data.database],
                ["Environment", data.environment],
                ["Uptime", formatUptime(data.uptime)],
                ["Last checked", formatDate(data.timestamp)],
              ].map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  )
}
