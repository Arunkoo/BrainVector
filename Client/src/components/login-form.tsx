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
    <div
      className={cn("flex flex-col gap-6 animate-fade-in", className)}
      {...props}
    >
      {error && (
        <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 backdrop-blur-sm rounded-2xl shadow-soft animate-slide-up">
          {error}
        </div>
      )}
      <Card className="shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden relative">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-accent to-primary"></div>

        <CardHeader className="text-center space-y-2 pt-8">
          <CardTitle className="text-2xl font-bold gradient-text">
            Welcome back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Login to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email" className="font-semibold">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm focus:shadow-md transition-all"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="font-semibold">
                    Password
                  </FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline text-primary font-medium transition-colors"
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
                  className="h-12 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm focus:shadow-md transition-all"
                />
              </Field>
              <Field className="mt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12"
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
                <FieldDescription className="text-center mt-4">
                  Don't have an account?{" "}
                  <a
                    href="/Register"
                    className="text-primary hover:underline font-semibold transition-colors"
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
