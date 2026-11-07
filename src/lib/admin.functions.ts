import { createServerFn } from "@tanstack/react-start";

// Constant-time compare so the password can't be guessed by timing.
function same(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const checkAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => ({ password: String(d?.password ?? "").slice(0, 200) }))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) return { ok: false as const, error: "ADMIN_PASSWORD is not set on the server" };
    return same(data.password, expected) ? { ok: true as const } : { ok: false as const, error: "Wrong password" };
  });
