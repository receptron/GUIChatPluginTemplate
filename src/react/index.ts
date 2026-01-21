/**
 * MulmoChat Quiz Plugin - React Implementation
 *
 * Full React plugin with UI components.
 * Import from "@mulmochat-plugin/quiz/react"
 */

// Import styles for React components
import "../style.css";

import type { ToolPluginReact } from "gui-chat-protocol/react";
import type { QuizData, QuizArgs } from "../core/types";
import { pluginCore } from "../core/plugin";
import { View } from "./View";
import { Preview } from "./Preview";

// ============================================================================
// React Plugin (with components)
// ============================================================================

/**
 * Quiz plugin instance with React components
 */
export const plugin: ToolPluginReact<never, QuizData, QuizArgs> = {
  ...pluginCore,
  ViewComponent: View,
  PreviewComponent: Preview,
};

// Quiz-specific types
export type { QuizQuestion, QuizData, QuizArgs } from "../core/types";

// Core plugin utilities
export { pluginCore, executeQuiz } from "../core/plugin";
export { TOOL_NAME, TOOL_DEFINITION } from "../core/definition";
export { SAMPLES } from "../core/samples";

// Export components for direct use
export { View, Preview };

// Default export for compatibility: { plugin }
export default { plugin };
