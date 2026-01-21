/**
 * MulmoChat Plugin Core Exports
 *
 * Framework-agnostic types and plugin logic.
 * Import from "@mulmochat-plugin/quiz/core"
 */

// Quiz-specific types
export type { QuizQuestion, QuizData, QuizArgs } from "./types";

// Core plugin
export { pluginCore, executeQuiz } from "./plugin";
export { TOOL_NAME, TOOL_DEFINITION } from "./definition";
export { SAMPLES } from "./samples";
