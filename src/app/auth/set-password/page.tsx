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

export default function SetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [checking, setChecking] = useState(true);
  const [sesionValida, setSesionValida] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesionValida(!!session);
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSesionValida(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña tiene que tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    // Justo después de crear/confirmar la cuenta, la validación del token
    // puede tardar unos segundos en propagarse del lado de Supabase.
    // Reintentamos un par de veces antes de mostrar un error.
    let updateError = null;
    for (let intento = 0; intento < 7; intento++) {
      const { error: err } = await supabase.auth.updateUser({ password });
      updateError = err;
      if (!err) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    setLoading(false);

    if (updateError) {
      console.error("updateUser error:", updateError);
      setError(`No se pudo guardar la contraseña: ${updateError.message}`);
      return;
    }

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
          ) : !sesionValida ? (
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
