"use client";

import { useEffect, useState } from "react";
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

function leerTokensDeHash(): { accessToken: string; refreshToken: string } | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export default function SetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [checking, setChecking] = useState(true);
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(
    null
  );
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTokens(leerTokensDeHash());
    setChecking(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tokens) return;

    if (password.length < 8) {
      setError("La contraseña tiene que tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    // Usamos el access_token del enlace directamente en vez de dejar que el
    // SDK lo refresque: justo después de crear/confirmar la cuenta, un token
    // recién refrescado puede tardar unos segundos en propagarse del lado de
    // Supabase y devolver "User from sub claim in JWT does not exist".
    // Reintentamos por las dudas de todos modos.
    let ultimoError: string | null = null;
    let ok = false;

    for (let intento = 0; intento < 6; intento++) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      if (res.ok) {
        ok = true;
        break;
      }

      const body = await res.json().catch(() => null);
      ultimoError = body?.msg ?? body?.message ?? `Error ${res.status}`;
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!ok) {
      setLoading(false);
      console.error("updateUser error:", ultimoError);
      setError(`No se pudo guardar la contraseña: ${ultimoError}`);
      return;
    }

    // Ya se guardó la contraseña; ahora sí establecemos la sesión de la app.
    await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-1">
            <Bus className="size-7" />
          </div>
          <CardTitle className="text-xl">Passenger Tracker</CardTitle>
          <CardDescription>Creá tu contraseña para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <p className="text-center text-sm text-muted-foreground">Verificando enlace...</p>
          ) : !tokens ? (
            <p className="text-center text-sm text-destructive">
              Este enlace no es válido o ya venció. Pedí que te generen uno nuevo.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Contraseña nueva</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmar">Repetir contraseña</Label>
                <Input
                  id="confirmar"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" disabled={loading} className="h-12 text-base mt-1">
                {loading ? "Guardando... puede tardar unos segundos" : "Guardar y entrar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
