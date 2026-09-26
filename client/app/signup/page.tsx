import { SignupForm } from "@/components/forms/signup-form"
import { AuthGuard } from "@/components/auth-guard"

export default function SignupPage() {
  return (
    <AuthGuard guest>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </AuthGuard>
  )
}
