import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
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
  useAuthError,
  useAuthLoading,
  useAuthRegister,
  useAuthUser,
} from "../store/auth.store";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Spinner } from "./ui/spinner";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const register = useAuthRegister();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const user = useAuthUser();

  const navigate = useNavigate();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    try {
      await register({ name, email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.log("Registration failed on frontend side.", err);
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
            Create your account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name" className="font-semibold">
                  Full Name
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm focus:shadow-md transition-all"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email" className="font-semibold">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm focus:shadow-md transition-all"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password" className="font-semibold">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm focus:shadow-md transition-all"
                />
                <FieldDescription className="text-xs">
                  Must be at least 6 characters long.
                </FieldDescription>
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
                      Registering
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <FieldDescription className="text-center mt-4">
                  Already have an account?{" "}
                  <a
                    href="/Login"
                    className="text-primary hover:underline font-semibold transition-colors"
                  >
                    Login
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
