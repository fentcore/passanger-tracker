"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEnviado, setResetEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/set-password`,
    });

    setLoading(false);
    setResetEnviado(true);
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-1">
            <Bus className="size-7" />
          </div>
          <CardTitle className="text-xl">Passenger Tracker</CardTitle>
          <CardDescription>
            {modo === "login" ? "Iniciá sesión para continuar" : "Recuperar contraseña"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modo === "login" ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  placeholder="tu@email.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 text-base mt-1"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setModo("reset");
                  setError(null);
                  setResetEnviado(false);
                }}
                className="text-sm text-muted-foreground underline text-center"
              >
                ¿Olvidaste tu contraseña o todavía no la creaste?
              </button>
            </form>
          ) : resetEnviado ? (
            <div className="flex flex-col gap-4 items-center text-center">
              <p className="text-sm">
                Si <span className="font-medium">{email}</span> tiene una cuenta, te
                enviamos un email con un enlace para crear tu contraseña. Revisá también
                spam/promociones.
              </p>
              <button
                type="button"
                onClick={() => setModo("login")}
                className="text-sm text-muted-foreground underline"
              >
                Volver al login
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  placeholder="tu@email.com"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-12 text-base mt-1">
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>
              <button
                type="button"
                onClick={() => setModo("login")}
                className="text-sm text-muted-foreground underline text-center"
              >
                Volver al login
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
