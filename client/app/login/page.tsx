import { LoginForm } from "@/components/forms/login-form"
import { AuthGuard } from "@/components/auth-guard"

export default function LoginPage() {
  return (
    <AuthGuard guest>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </AuthGuard>
  )
}
