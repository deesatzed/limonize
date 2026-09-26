import { createServerFn } from "@tanstack/react-start";
import { validateProviderRequest, type ProviderRequest } from "./provider-protocol";
import { EXTERNAL_REFLECTION_DISABLED } from "./charter";

export type ReflectionRequest = ProviderRequest;
export const validateReflectionRequest = validateProviderRequest;

// This endpoint cannot spend quota. Re-enable only with a shared server-side usage ledger,
// timeouts, deduplication and a reviewed consent surface.
export const reflectFurther = createServerFn({ method: "POST" })
  .validator(validateReflectionRequest)
  .handler(async () => ({ ok: false as const, error: EXTERNAL_REFLECTION_DISABLED, model: "" }));
