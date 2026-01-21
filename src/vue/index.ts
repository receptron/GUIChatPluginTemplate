/**
 * MulmoChat Quiz Plugin - Vue Implementation
 *
 * Full Vue plugin with UI components.
 * Import from "@mulmochat-plugin/quiz/vue"
 */

// Import styles for Vue components
import "../style.css";

import type { ToolPlugin } from "gui-chat-protocol/vue";
import type { QuizData, QuizArgs } from "../core/types";
import { pluginCore } from "../core/plugin";
import View from "./View.vue";
import Preview from "./Preview.vue";

// ============================================================================
// Vue Plugin (with components)
// ============================================================================

/**
 * Quiz plugin instance with Vue components
 */
export const plugin: ToolPlugin<never, QuizData, QuizArgs> = {
  ...pluginCore,
  viewComponent: View,
  previewComponent: Preview,
};

// Quiz-specific types
export type { QuizQuestion, QuizData, QuizArgs } from "../core/types";

// Core plugin utilities
export { pluginCore, executeQuiz } from "../core/plugin";
export { TOOL_NAME, TOOL_DEFINITION } from "../core/definition";
export { SAMPLES } from "../core/samples";

// Export components for direct use
export { View, Preview };

// Default export for MulmoChat compatibility: { plugin }
export default { plugin };
