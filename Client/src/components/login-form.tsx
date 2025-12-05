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
      console.error("Login failed", err);
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-6 animate-fade-in", className)}
      {...props}
    >
      {error && (
        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}
      <Card className="border shadow-sm">
        <CardHeader className="text-center space-y-2 pb-2">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="space-y-4">
              <Field>
                <FieldLabel htmlFor="email" className="text-sm font-medium">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Password
                  </FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-xs underline-offset-4 hover:underline text-primary"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </Field>
              <Field className="mt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
                <FieldDescription className="text-center mt-4 text-sm">
                  Don't have an account?{" "}
                  <a
                    href="/Register"
                    className="text-primary hover:underline font-medium"
                  >
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
