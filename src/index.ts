/**
 * MulmoChat Quiz Plugin
 *
 * Default export is the framework-agnostic core.
 * For Vue implementation, import from "@mulmochat-plugin/quiz/vue"
 *
 * @example Default (Core - framework-agnostic)
 * ```typescript
 * import { pluginCore, TOOL_NAME, QuizData } from "@mulmochat-plugin/quiz";
 * ```
 *
 * @example Vue implementation
 * ```typescript
 * import QuizPlugin from "@mulmochat-plugin/quiz/vue";
 * import "@mulmochat-plugin/quiz/style.css";
 * ```
 */

// Default export is core (framework-agnostic)
export * from "./core";
export { pluginCore as default } from "./core";

