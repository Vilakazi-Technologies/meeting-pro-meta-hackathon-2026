/**
 * Resolve the Meta access token for a tenant. Shared by every function that
 * talks to Meta.
 *
 * TODO(tenancy): the schema stores whatsapp_numbers.access_token_secret_id, a
 * pointer into Supabase Vault, so per-tenant tokens never sit in application
 * tables. Reading Vault needs a SECURITY DEFINER function that no migration
 * defines yet, so this falls back to one environment token. Correct for a
 * single business, WRONG for multi-tenant — replace it before a second business
 * is onboarded.
 */
export function resolveAccessToken(_businessId: string, _numberId: string | null): Promise<string> {
  const token = Deno.env.get("META_ACCESS_TOKEN") ?? "";
  if (!token) return Promise.reject(new Error("META_ACCESS_TOKEN is not set"));
  return Promise.resolve(token);
}
