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
} from "../auth/auth.store";
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
    // Redirects logged-in users to the 'from' path or the homepage
    return <Navigate to={fromPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear previous errors

    if (!email || !password) return;

    try {
      // 2. Call the Zustand login action
      await login({ email, password });

      // 3. Success! Navigate to the intended destination (or it will happen automatically
      //    as the router sees the user state change and the component re-renders).
      navigate(fromPath, { replace: true });
    } catch (err) {
      // Error message is already set in the Zustand store 'error' state
      console.error("Login failed on frontend side.", err);
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
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
                    className="ml-auto text-sm underline-offset-4 hover:underline"
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
                  className="bg-black text-white cursor-pointer hover:bg-black/95 hover:text-white/95"
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
                  Don&apos;t have an account? <a href="/Register">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
