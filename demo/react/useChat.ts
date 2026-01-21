/**
 * useChat - React hook for plugin demo chat
 */
import { useState, useCallback, useMemo } from "react";
import type { ToolPluginReact, ToolResult, ToolContext } from "gui-chat-protocol/react";
import {
  type ChatMessage,
  loadApiKey,
  findMockResponse,
  createOpenAIClient,
  buildSystemPrompt,
  convertToApiMessages,
  buildToolsParam,
  executePluginWithContext,
  callOpenAI,
} from "../shared";

export type { ChatMessage } from "../shared";

export interface UseChatOptions {
  plugin: ToolPluginReact;
  model?: string;
  systemPrompt?: string;
}

export function useChat(options: UseChatOptions) {
  const { plugin, model = "gpt-4o-mini" } = options;

  // Load initial API key
  const initialKey = loadApiKey();

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey] = useState(initialKey);
  const [useMockMode, setUseMockMode] = useState(!initialKey);
  const [result, setResult] = useState<ToolResult | null>(null);

  // Computed values
  const hasApiKey = useMemo(() => apiKey.length > 0, [apiKey]);
  const toolDefinition = useMemo(() => plugin.toolDefinition, [plugin]);

  /**
   * Execute plugin with given arguments
   */
  const executePlugin = useCallback(
    async (args: unknown): Promise<ToolResult> => {
      const execute = plugin.execute as (context: ToolContext, args: unknown) => Promise<ToolResult>;
      return await executePluginWithContext(execute, args, result);
    },
    [plugin, result]
  );

  /**
   * Handle mock mode response
   */
  const handleMockResponse = useCallback(
    async (userMessage: string, currentMessages: ChatMessage[]): Promise<ChatMessage[]> => {
      const mockResponse = findMockResponse(userMessage);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newMessages = [...currentMessages];

      if (mockResponse.toolCall) {
        const toolCallId = `mock_${Date.now()}`;

        newMessages.push({
          role: "assistant",
          content: "",
          toolCalls: [
            {
              id: toolCallId,
              name: mockResponse.toolCall.name,
              arguments: JSON.stringify(mockResponse.toolCall.args),
            },
          ],
        });

        const toolResult = await executePlugin(mockResponse.toolCall.args);
        setResult(toolResult);

        newMessages.push({
          role: "tool",
          content: JSON.stringify(toolResult.jsonData || toolResult.message),
          toolCallId,
        });

        newMessages.push({
          role: "assistant",
          content: toolResult.message,
        });
      } else {
        newMessages.push({
          role: "assistant",
          content: mockResponse.content || "",
        });
      }

      return newMessages;
    },
    [executePlugin]
  );

  /**
   * Send message to LLM (real or mock)
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) return;

      setError(null);
      setIsLoading(true);

      const userMessage: ChatMessage = { role: "user", content };
      let currentMessages = [...messages, userMessage];
      setMessages(currentMessages);

      try {
        if (useMockMode || !hasApiKey) {
          const newMessages = await handleMockResponse(content, currentMessages);
          setMessages(newMessages);
          return;
        }

        const client = createOpenAIClient(apiKey);
        const systemPrompt = buildSystemPrompt(options.systemPrompt, plugin.systemPrompt);
        const tools = buildToolsParam(toolDefinition);

        // Initial API call
        let apiMessages = convertToApiMessages(currentMessages, systemPrompt);
        let response = await callOpenAI(client, model, apiMessages, tools);
        let choice = response.choices[0];
        let message = choice.message;

        // Process tool calls if any
        while (message.tool_calls && message.tool_calls.length > 0) {
          const toolCalls = message.tool_calls.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          }));

          currentMessages = [
            ...currentMessages,
            {
              role: "assistant" as const,
              content: message.content || "",
              toolCalls,
            },
          ];

          // Execute all tool calls and collect instructions
          let lastInstructions: string | undefined;

          for (const toolCall of toolCalls) {
            const args = JSON.parse(toolCall.arguments);
            const toolResult = await executePlugin(args);
            setResult(toolResult);

            // Store instructions from the last tool result
            if (toolResult.instructions) {
              lastInstructions = toolResult.instructions;
            }

            currentMessages = [
              ...currentMessages,
              {
                role: "tool" as const,
                content: JSON.stringify(toolResult.jsonData || toolResult.message),
                toolCallId: toolCall.id,
              },
            ];
          }

          setMessages([...currentMessages]);

          // Call API again to get LLM's response to tool results
          // Include instructions in the system prompt if available
          const instructionPrompt = lastInstructions
            ? `${systemPrompt}\n\n[Instructions for next response]: ${lastInstructions}`
            : systemPrompt;

          apiMessages = convertToApiMessages(currentMessages, instructionPrompt);
          response = await callOpenAI(client, model, apiMessages, tools);
          choice = response.choices[0];
          message = choice.message;
        }

        // Add final assistant response
        if (message.content) {
          currentMessages = [
            ...currentMessages,
            {
              role: "assistant" as const,
              content: message.content,
            },
          ];
          setMessages(currentMessages);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error occurred");
        console.error("Chat error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, useMockMode, hasApiKey, handleMockResponse, apiKey, options.systemPrompt, plugin.systemPrompt, toolDefinition, model, executePlugin]
  );

  /**
   * Clear chat history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setResult(null);
    setError(null);
  }, []);

  /**
   * Toggle mock mode
   */
  const toggleMockMode = useCallback(() => {
    setUseMockMode((prev) => !prev);
  }, []);

  return {
    // State
    messages,
    isLoading,
    error,
    result,
    setResult,
    apiKey,
    useMockMode,

    // Computed
    hasApiKey,
    toolDefinition,

    // Actions
    sendMessage,
    clearMessages,
    toggleMockMode,
    executePlugin,
  };
}
