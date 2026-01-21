/**
 * Shared chat types for Vue and React demos
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  toolCallId?: string;
}

export interface MockResponse {
  content?: string;
  toolCall?: {
    name: string;
    args: unknown;
  };
}
