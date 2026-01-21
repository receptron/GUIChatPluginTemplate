/**
 * useChat - Vue composable for plugin demo chat
 */
import { ref, computed } from "vue";
import type { ToolPlugin, ToolResult, ToolContext } from "gui-chat-protocol/vue";
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
  plugin: ToolPlugin;
  model?: string;
  systemPrompt?: string;
}

export function useChat(options: UseChatOptions) {
  const { plugin, model = "gpt-4o-mini" } = options;

  // Load initial API key
  const initialKey = loadApiKey();

  // State
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const apiKey = ref(initialKey);
  const useMockMode = ref(!initialKey);
  const result = ref<ToolResult | null>(null);

  // Computed
  const hasApiKey = computed(() => apiKey.value.length > 0);
  const toolDefinition = computed(() => plugin.toolDefinition);

  /**
   * Execute plugin with given arguments
   */
  const executePlugin = async (args: unknown): Promise<ToolResult> => {
    const execute = plugin.execute as (context: ToolContext, args: unknown) => Promise<ToolResult>;
    return await executePluginWithContext(execute, args, result.value);
  };

  /**
   * Handle mock mode response
   */
  const handleMockResponse = async (userMessage: string): Promise<void> => {
    const mockResponse = findMockResponse(userMessage);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (mockResponse.toolCall) {
      const toolCallId = `mock_${Date.now()}`;

      messages.value.push({
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
      result.value = toolResult;

      messages.value.push({
        role: "tool",
        content: JSON.stringify(toolResult.jsonData || toolResult.message),
        toolCallId,
      });

      messages.value.push({
        role: "assistant",
        content: toolResult.message,
      });
    } else {
      messages.value.push({
        role: "assistant",
        content: mockResponse.content || "",
      });
    }
  };

  /**
   * Send message to LLM (real or mock)
   */
  const sendMessage = async (content: string): Promise<void> => {
    if (!content.trim()) return;

    error.value = null;
    isLoading.value = true;

    messages.value.push({ role: "user", content });

    try {
      if (useMockMode.value || !hasApiKey.value) {
        await handleMockResponse(content);
        return;
      }

      const client = createOpenAIClient(apiKey.value);
      const systemPrompt = buildSystemPrompt(options.systemPrompt, plugin.systemPrompt);
      const tools = buildToolsParam(toolDefinition.value);

      // Initial API call
      let apiMessages = convertToApiMessages(messages.value, systemPrompt);
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

        messages.value.push({
          role: "assistant",
          content: message.content || "",
          toolCalls,
        });

        // Execute all tool calls and collect instructions
        let lastInstructions: string | undefined;

        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.arguments);
          const toolResult = await executePlugin(args);
          result.value = toolResult;

          // Store instructions from the last tool result
          if (toolResult.instructions) {
            lastInstructions = toolResult.instructions;
          }

          messages.value.push({
            role: "tool",
            content: JSON.stringify(toolResult.jsonData || toolResult.message),
            toolCallId: toolCall.id,
          });
        }

        // Call API again to get LLM's response to tool results
        // Include instructions in the system prompt if available
        const instructionPrompt = lastInstructions
          ? `${systemPrompt}\n\n[Instructions for next response]: ${lastInstructions}`
          : systemPrompt;

        apiMessages = convertToApiMessages(messages.value, instructionPrompt);
        response = await callOpenAI(client, model, apiMessages, tools);
        choice = response.choices[0];
        message = choice.message;
      }

      // Add final assistant response
      if (message.content) {
        messages.value.push({
          role: "assistant",
          content: message.content,
        });
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error occurred";
      console.error("Chat error:", e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Clear chat history
   */
  const clearMessages = () => {
    messages.value = [];
    result.value = null;
    error.value = null;
  };

  /**
   * Toggle mock mode
   */
  const toggleMockMode = () => {
    useMockMode.value = !useMockMode.value;
  };

  return {
    // State
    messages,
    isLoading,
    error,
    result,
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
