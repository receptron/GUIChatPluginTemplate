/**
 * MulmoChat Quiz Plugin Core (Framework-agnostic)
 *
 * Contains the plugin logic without UI components.
 * Can be used by any framework (Vue, React, etc.)
 */

import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";
import type { QuizData, QuizArgs } from "./types";
import { TOOL_DEFINITION } from "./definition";
import { SAMPLES } from "./samples";

// ============================================================================
// Execute Function
// ============================================================================

export const executeQuiz = async (
  _context: ToolContext,
  args: QuizArgs,
): Promise<ToolResult<never, QuizData>> => {
  try {
    const { title, questions } = args;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error("At least one question is required");
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || typeof q.question !== "string") {
        throw new Error(`Question ${i + 1} must have a question text`);
      }
      if (!Array.isArray(q.choices) || q.choices.length < 2) {
        throw new Error(`Question ${i + 1} must have at least 2 choices`);
      }
      if (q.choices.length > 6) {
        throw new Error(`Question ${i + 1} cannot have more than 6 choices`);
      }
    }

    const quizData: QuizData = {
      title,
      questions,
    };

    return {
      toolName: TOOL_DEFINITION.name,
      message: `Quiz presented with ${questions.length} question${questions.length > 1 ? "s" : ""}`,
      jsonData: quizData,
      instructions:
        "The quiz has been presented to the user. Wait for the user to submit their answers. They will tell you their answers in text format.",
    };
  } catch (error) {
    console.error("Quiz creation error", error);
    return {
      toolName: TOOL_DEFINITION.name,
      message: `Quiz error: ${error instanceof Error ? error.message : "Unknown error"}`,
      instructions:
        "Acknowledge that there was an error creating the quiz and suggest trying again.",
    };
  }
};

// ============================================================================
// Core Plugin (without UI components)
// ============================================================================

export const pluginCore: ToolPluginCore<never, QuizData, QuizArgs> = {
  toolDefinition: TOOL_DEFINITION,
  execute: executeQuiz,
  generatingMessage: "Preparing quiz...",
  isEnabled: () => true,
  samples: SAMPLES,
};
