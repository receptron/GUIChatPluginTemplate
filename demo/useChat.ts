/**
 * useChat - Chat composable for plugin demo
 *
 * Provides LLM integration for testing plugins in a chat environment.
 * Supports both real OpenAI API and mock mode for development without API key.
 */
import { ref, computed } from "vue";
import OpenAI from "openai";
import type { ToolPlugin, ToolResult, ToolContext } from "gui-chat-protocol/vue";

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

export interface UseChatOptions {
  plugin: ToolPlugin;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
}

/**
 * Mock responses for development without API key
 */
const MOCK_RESPONSES: Record<string, { content?: string; toolCall?: { name: string; args: unknown } }> = {
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
 * Load API key from environment variable (Vite)
 */
const loadApiKey = (): string => {
  return import.meta.env?.VITE_OPENAI_API_KEY || "";
};

export function useChat(options: UseChatOptions) {
  const { plugin, model = "gpt-4o-mini" } = options;

  // Load initial API key
  const initialKey = options.apiKey || loadApiKey();

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
   * Build system prompt including plugin's system prompt
   */
  const buildSystemPrompt = () => {
    const basePrompt = options.systemPrompt || "You are a helpful assistant.";
    const pluginPrompt = plugin.systemPrompt || "";
    return `${basePrompt}\n\n${pluginPrompt}`.trim();
  };

  /**
   * Initialize OpenAI client
   */
  const getClient = () => {
    if (!apiKey.value) return null;
    return new OpenAI({
      apiKey: apiKey.value,
      dangerouslyAllowBrowser: true, // For demo purposes only
    });
  };

  /**
   * Execute plugin with given arguments
   */
  const executePlugin = async (args: unknown): Promise<ToolResult> => {
    const context: ToolContext = {
      currentResult: result.value,
    };
    return await plugin.execute(context, args);
  };

  /**
   * Handle mock mode response
   */
  const handleMockResponse = async (userMessage: string): Promise<void> => {
    const lowerMessage = userMessage.toLowerCase();

    // Determine mock response based on message content
    let mockResponse = MOCK_RESPONSES.default;
    if (lowerMessage.includes("quiz") || lowerMessage.includes("question")) {
      mockResponse = MOCK_RESPONSES.quiz;
    } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      mockResponse = MOCK_RESPONSES.hello;
    }

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (mockResponse.toolCall) {
      // Simulate tool call
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

      // Execute plugin
      const toolResult = await executePlugin(mockResponse.toolCall.args);
      result.value = toolResult;

      messages.value.push({
        role: "tool",
        content: JSON.stringify(toolResult.jsonData || toolResult.message),
        toolCallId,
      });

      // Final assistant response
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

    // Add user message
    messages.value.push({
      role: "user",
      content,
    });

    try {
      if (useMockMode.value || !hasApiKey.value) {
        await handleMockResponse(content);
        return;
      }

      const client = getClient();
      if (!client) {
        throw new Error("OpenAI client not initialized");
      }

      // Build messages for API
      const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: buildSystemPrompt() },
        ...messages.value.map((m) => {
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

      // Call OpenAI API
      const response = await client.chat.completions.create({
        model,
        messages: apiMessages,
        tools: [
          {
            type: "function",
            function: {
              name: toolDefinition.value.name,
              description: toolDefinition.value.description,
              parameters: toolDefinition.value.parameters,
            },
          },
        ],
        tool_choice: "auto",
      });

      const choice = response.choices[0];
      const message = choice.message;

      if (message.tool_calls && message.tool_calls.length > 0) {
        // Handle tool calls
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

        // Execute each tool call
        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.arguments);
          const toolResult = await executePlugin(args);
          result.value = toolResult;

          messages.value.push({
            role: "tool",
            content: JSON.stringify(toolResult.jsonData || toolResult.message),
            toolCallId: toolCall.id,
          });
        }

        // Get follow-up response if there are instructions
        if (result.value?.instructions) {
          const followUpResponse = await client.chat.completions.create({
            model,
            messages: [
              ...apiMessages,
              ...messages.value.slice(-toolCalls.length * 2).map((m) => {
                if (m.role === "tool") {
                  return {
                    role: "tool" as const,
                    content: m.content,
                    tool_call_id: m.toolCallId!,
                  };
                }
                return {
                  role: m.role as "assistant",
                  content: m.content || null,
                  tool_calls: m.toolCalls?.map((tc) => ({
                    id: tc.id,
                    type: "function" as const,
                    function: { name: tc.name, arguments: tc.arguments },
                  })),
                };
              }),
            ],
          });

          const followUpMessage = followUpResponse.choices[0].message;
          if (followUpMessage.content) {
            messages.value.push({
              role: "assistant",
              content: followUpMessage.content,
            });
          }
        }
      } else {
        // Regular text response
        messages.value.push({
          role: "assistant",
          content: message.content || "",
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
   * Set API key and switch to real mode
   */
  const setApiKey = (key: string) => {
    apiKey.value = key;
    useMockMode.value = !key;
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
    setApiKey,
    toggleMockMode,
    executePlugin,
  };
}
