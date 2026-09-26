import { AuthForm } from "@/components/forms/auth-form"

export function SignupForm(props: React.ComponentProps<"div">) {
  return <AuthForm mode="signup" {...props} />
}
