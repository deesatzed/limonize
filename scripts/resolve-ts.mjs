// Node's TypeScript stripping leaves extensionless relative imports unresolved.
// Resolve repository TypeScript modules for the test runner without changing
// application import specifiers or introducing a second transpiler.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // Continue with Node's normal resolver, preserving its real error.
      }
    }
    return nextResolve(specifier, context);
  },
});
