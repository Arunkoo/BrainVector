import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Spinner } from "./ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../components/ui/field";
import { Input } from "../components/ui/input";
import {
  useAuthClearError,
  useAuthError,
  useAuthLoading,
  useAuthLogin,
  useAuthUser,
} from "../store/auth.store";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const login = useAuthLogin();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const clearError = useAuthClearError();
  const navigate = useNavigate();
  const user = useAuthUser();
  const location = useLocation();
  const fromPath =
    location.state?.from?.pathname &&
    location.state?.from?.pathname !== "/login"
      ? location.state.from.pathname
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    return <Navigate to={fromPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) return;

    try {
      await login({ email, password });
      navigate(fromPath, { replace: true });
    } catch (err) {
      console.error("Login failed on frontend side.", err);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {error && (
        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/30 rounded-lg">
          {error}
        </div>
      )}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline text-primary"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full 
                    bg-primary text-primary-foreground hover:bg-primary/90
                    dark:bg-white/90 dark:text-foreground dark:border dark:border-border dark:hover:bg-white
                  "
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      Authenticating
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
                <FieldDescription className="text-center">
                  Don't have an account?{" "}
                  <a href="/Register" className="text-primary hover:underline">
                    Sign up
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
