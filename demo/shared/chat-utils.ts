/**
 * Shared chat utilities for Vue and React demos
 */
import OpenAI from "openai";
import type { ToolDefinition, ToolContext, ToolResult } from "gui-chat-protocol";
import type { ChatMessage, MockResponse } from "./chat-types";

/**
 * Load API key from environment variable (Vite)
 */
export const loadApiKey = (): string => {
  return import.meta.env?.VITE_OPENAI_API_KEY || "";
};

/**
 * Default mock responses for development without API key
 */
export const DEFAULT_MOCK_RESPONSES: Record<string, MockResponse> = {
  quiz: {
    toolCall: {
      name: "putQuestions",
      args: {
        title: "Demo Quiz",
        questions: [
          {
            question: "What is 2 + 2?",
            choices: ["3", "4", "5", "6"],
            correctAnswer: 1,
          },
        ],
      },
    },
  },
  hello: {
    content: "Hello! How can I help you today?",
  },
  default: {
    content: "I understand. Is there anything else you'd like to know?",
  },
};

/**
 * Find matching mock response based on user message
 */
export const findMockResponse = (
  userMessage: string,
  mockResponses: Record<string, MockResponse> = DEFAULT_MOCK_RESPONSES
): MockResponse => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("quiz") || lowerMessage.includes("question")) {
    return mockResponses.quiz || DEFAULT_MOCK_RESPONSES.quiz;
  }
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return mockResponses.hello || DEFAULT_MOCK_RESPONSES.hello;
  }

  return mockResponses.default || DEFAULT_MOCK_RESPONSES.default;
};

/**
 * Create OpenAI client
 */
export const createOpenAIClient = (apiKey: string): OpenAI => {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
};

/**
 * Build system prompt including plugin's system prompt
 */
export const buildSystemPrompt = (basePrompt?: string, pluginPrompt?: string): string => {
  const base = basePrompt || "You are a helpful assistant.";
  const plugin = pluginPrompt || "";
  return `${base}\n\n${plugin}`.trim();
};

/**
 * Convert ChatMessage array to OpenAI API format
 */
export const convertToApiMessages = (
  messages: ChatMessage[],
  systemPrompt: string
): OpenAI.Chat.ChatCompletionMessageParam[] => {
  return [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool" as const,
          content: m.content,
          tool_call_id: m.toolCallId!,
        };
      }
      if (m.role === "assistant" && m.toolCalls) {
        return {
          role: "assistant" as const,
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: tc.arguments,
            },
          })),
        };
      }
      return {
        role: m.role as "user" | "assistant",
        content: m.content,
      };
    }),
  ];
};

/**
 * Build tools array for OpenAI API
 */
export const buildToolsParam = (
  toolDefinition: ToolDefinition
): OpenAI.Chat.ChatCompletionTool[] => {
  return [
    {
      type: "function",
      function: {
        name: toolDefinition.name,
        description: toolDefinition.description,
        parameters: toolDefinition.parameters,
      },
    },
  ];
};

/**
 * Execute plugin and return result
 */
export const executePluginWithContext = async (
  execute: (context: ToolContext, args: unknown) => Promise<ToolResult>,
  args: unknown,
  currentResult: ToolResult | null
): Promise<ToolResult> => {
  const context: ToolContext = {
    currentResult,
  };
  return await execute(context, args);
};

/**
 * Call OpenAI Chat API
 */
export const callOpenAI = async (
  client: OpenAI,
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.ChatCompletionTool[]
): Promise<OpenAI.Chat.ChatCompletion> => {
  return await client.chat.completions.create({
    model,
    messages,
    tools,
    tool_choice: "auto",
  });
};
