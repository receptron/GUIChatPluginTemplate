<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">{{ pluginName }} Demo</h1>

      <!-- Settings Panel -->
      <div class="bg-white rounded-lg p-4 mb-4 shadow-md">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                :checked="useMockMode"
                @change="toggleMockMode"
                class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span class="text-sm text-gray-700">Mock Mode (no API key needed)</span>
            </label>
            <span v-if="hasApiKey && !useMockMode" class="text-xs text-green-600">
              API Key loaded from .env
            </span>
          </div>
          <button
            @click="clearMessages"
            class="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Chat
          </button>
        </div>
        <p v-if="!hasApiKey && !useMockMode" class="mt-2 text-xs text-amber-600">
          No API key found. Create a .env file with VITE_OPENAI_API_KEY=your-key
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left: Chat Panel -->
        <div class="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
          <div class="p-3 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-700">Chat</h2>
            <p class="text-xs text-gray-500">
              {{ useMockMode ? "Mock mode - try 'quiz' or 'hello'" : "Real API mode" }}
            </p>
          </div>

          <!-- Messages -->
          <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="[
                'p-3 rounded-lg max-w-[85%]',
                message.role === 'user'
                  ? 'bg-indigo-100 ml-auto text-right'
                  : message.role === 'assistant'
                    ? 'bg-gray-100'
                    : 'bg-amber-50 text-xs font-mono',
              ]"
            >
              <div class="text-xs text-gray-500 mb-1">{{ message.role }}</div>
              <div class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
              <div v-if="message.toolCalls" class="mt-2 text-xs text-indigo-600">
                Tool call: {{ message.toolCalls.map((tc) => tc.name).join(", ") }}
              </div>
            </div>

            <div v-if="isLoading" class="text-center text-gray-500 text-sm">
              <span class="animate-pulse">Thinking...</span>
            </div>

            <div v-if="error" class="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {{ error }}
            </div>
          </div>

          <!-- Input -->
          <div class="p-3 border-t border-gray-200">
            <div class="flex gap-2">
              <input
                v-model="userInput"
                @keydown.enter="handleKeyDown"
                type="text"
                placeholder="Type a message... (try 'show me a quiz')"
                :disabled="isLoading"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
              <button
                @click="handleSend"
                :disabled="isLoading || !userInput.trim()"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Plugin View -->
        <div class="space-y-4">
          <!-- View Component -->
          <div v-if="ViewComponent && result" class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-3 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-700">View Component</h2>
            </div>
            <div class="p-4">
              <component
                :is="ViewComponent"
                :selectedResult="result"
                :sendTextMessage="handleSendTextMessage"
                @updateResult="handleUpdateResult"
              />
            </div>
          </div>

          <div v-else class="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <p>Send a message to see the plugin view</p>
            <p class="text-sm mt-2">Try: "show me a quiz" or "create a quiz about JavaScript"</p>
          </div>

          <!-- Preview Component -->
          <div v-if="PreviewComponent && result" class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-3 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-700">Preview Component</h2>
            </div>
            <div class="p-4">
              <div class="max-w-[200px]">
                <component :is="PreviewComponent" :result="result" />
              </div>
            </div>
          </div>

          <!-- Sample Buttons -->
          <div v-if="samples.length > 0" class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-3 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-700">Quick Samples</h2>
            </div>
            <div class="p-4 flex flex-wrap gap-2">
              <button
                v-for="(sample, index) in samples"
                :key="index"
                @click="executeSample(sample)"
                class="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
              >
                {{ sample.name }}
              </button>
            </div>
          </div>

          <!-- Result Data (Debug) -->
          <details class="bg-white rounded-lg shadow-md overflow-hidden">
            <summary class="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50">
              <span class="text-lg font-semibold text-gray-700">Result Data (Debug)</span>
            </summary>
            <div class="p-4">
              <pre class="bg-gray-100 p-3 rounded overflow-x-auto text-xs">{{
                JSON.stringify(result, null, 2)
              }}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { plugin } from "../../src/vue";
import { useChat } from "./useChat";
import type { ToolPlugin, ToolSample, ToolResult } from "gui-chat-protocol/vue";

// Plugin configuration
const currentPlugin = plugin as unknown as ToolPlugin;

// Chat composable
const {
  messages,
  isLoading,
  error,
  result,
  useMockMode,
  hasApiKey,
  sendMessage,
  clearMessages,
  toggleMockMode,
  executePlugin,
} = useChat({
  plugin: currentPlugin,
});

// Local state
const userInput = ref("");
const messagesContainer = ref<HTMLElement | null>(null);

// Computed properties from plugin
const pluginName = computed(() => currentPlugin.toolDefinition.name);
const samples = computed(() => currentPlugin.samples || []);
const ViewComponent = computed(() => currentPlugin.viewComponent);
const PreviewComponent = computed(() => currentPlugin.previewComponent);

// Scroll to bottom when new messages arrive
watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }
);

// Actions
const handleKeyDown = (e: KeyboardEvent) => {
  // Don't submit while composing (IME input)
  if (e.isComposing) return;
  handleSend();
};

const handleSend = async () => {
  const text = userInput.value.trim();
  if (!text || isLoading.value) return;

  userInput.value = "";
  await sendMessage(text);
};

const handleSendTextMessage = (text?: string) => {
  if (text) {
    userInput.value = text;
    handleSend();
  }
  console.log("sendTextMessage called:", text);
};

const handleUpdateResult = (updated: ToolResult) => {
  result.value = updated;
  console.log("Result updated:", updated);
};

const executeSample = async (sample: ToolSample) => {
  const toolResult = await executePlugin(sample.args);
  result.value = toolResult;

  // Add to messages for context
  messages.value.push({
    role: "assistant",
    content: `Executed sample: ${sample.name}`,
    toolCalls: [
      {
        id: `sample_${Date.now()}`,
        name: currentPlugin.toolDefinition.name,
        arguments: JSON.stringify(sample.args),
      },
    ],
  });
};
</script>
