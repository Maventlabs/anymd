import AuthForm from "@/components/auth-form";
import { getServerEnv } from "@/lib/server-env";

export default function LoginPage() {
  return (
    <AuthForm
      mode="login"
      googleEnabled={Boolean(
        getServerEnv("AUTH_GOOGLE_ID") && getServerEnv("AUTH_GOOGLE_SECRET"),
      )}
      githubEnabled={Boolean(
        getServerEnv("AUTH_GITHUB_ID") && getServerEnv("AUTH_GITHUB_SECRET"),
      )}
    />
  );
}
