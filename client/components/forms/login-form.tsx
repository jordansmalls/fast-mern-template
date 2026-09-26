import { AuthForm } from "@/components/forms/auth-form"

export function LoginForm(props: React.ComponentProps<"div">) {
  return <AuthForm mode="login" {...props} />
}
