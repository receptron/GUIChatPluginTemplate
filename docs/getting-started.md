# Getting Started - Your First Plugin

This guide walks you through creating your first GUIChat plugin step by step. No prior plugin development experience required!

## What You'll Build

A simple "Greeting Card" plugin that:
- Takes a name as input
- Displays a personalized greeting card

## Prerequisites

- Node.js 18+ installed
- Basic knowledge of TypeScript
- Basic knowledge of Vue or React

## Step 1: Set Up the Project

```bash
# Clone the template
git clone https://github.com/receptron/GUIChatPluginTemplate.git GUIChatPluginGreeting
cd GUIChatPluginGreeting

# Install dependencies
npm install
```

## Step 2: Run the Demo

```bash
npm run dev
```

Open http://localhost:5173. You'll see the Quiz demo working.

**Try it:**
1. Click "Simple Quiz" button in the Quick Samples section
2. See the Quiz View appear
3. Answer the questions

## Step 3: Understand the Template

Before making changes, let's understand what each file does:

```
src/
├── core/                    # Plugin logic (no UI)
│   ├── definition.ts        # Tool name & parameters
│   ├── plugin.ts           # Main execute function
│   ├── types.ts            # TypeScript types
│   └── samples.ts          # Test data
└── vue/                     # Vue UI components
    ├── View.vue            # Main display
    └── Preview.vue         # Thumbnail
```

## Step 4: Define Your Tool (definition.ts)

Edit `src/core/definition.ts`:

```typescript
import type { ToolDefinition } from "gui-chat-protocol";

// Tool name (used to identify results)
export const TOOL_NAME = "greetingCard";

// Tool definition for LLM
export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description: "Create a personalized greeting card with a custom message",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the person to greet",
      },
      message: {
        type: "string",
        description: "Optional custom message",
      },
    },
    required: ["name"],
  },
};

// System prompt (optional instructions for LLM)
export const SYSTEM_PROMPT = `When the user wants to create a greeting or send a message to someone, use the ${TOOL_NAME} tool.`;
```

**Key Points:**
- `TOOL_NAME`: Unique identifier for your plugin
- `description`: Tells LLM when to use this tool
- `parameters`: What inputs the tool accepts

## Step 5: Define Types (types.ts)

Edit `src/core/types.ts`:

```typescript
/**
 * Data for View/Preview components
 */
export interface GreetingData {
  name: string;
  message: string;
  createdAt: string;
}

/**
 * Arguments passed to execute function
 */
export interface GreetingArgs {
  name: string;
  message?: string;
}
```

## Step 6: Implement Execute Function (plugin.ts)

Edit `src/core/plugin.ts`:

```typescript
import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";
import type { GreetingData, GreetingArgs } from "./types";
import { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT } from "./definition";
import { SAMPLES } from "./samples";

export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT } from "./definition";

/**
 * Execute function - runs when LLM calls this tool
 */
export const executeGreeting = async (
  _context: ToolContext,
  args: GreetingArgs,
): Promise<ToolResult<GreetingData, never>> => {
  const { name, message } = args;

  // Create greeting data
  const greetingData: GreetingData = {
    name,
    message: message || `Hello, ${name}! Welcome!`,
    createdAt: new Date().toLocaleString(),
  };

  return {
    toolName: TOOL_NAME,
    message: `Greeting card created for ${name}`,
    data: greetingData,
    instructions: "Tell the user that the greeting card has been created.",
  };
};

/**
 * Plugin core (framework-agnostic)
 */
export const pluginCore: ToolPluginCore<GreetingData, never, GreetingArgs> = {
  toolDefinition: TOOL_DEFINITION,
  execute: executeGreeting,
  generatingMessage: "Creating greeting card...",
  isEnabled: () => true,
  systemPrompt: SYSTEM_PROMPT,
  samples: SAMPLES,
};
```

**Key Points:**
- `execute()` receives `args` from LLM
- Returns `ToolResult` with `data` for the View component
- `message` is sent back to LLM
- `instructions` tells LLM what to say next

## Step 7: Add Test Samples (samples.ts)

Edit `src/core/samples.ts`:

```typescript
import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "Simple Greeting",
    args: {
      name: "Alice",
    },
  },
  {
    name: "Custom Message",
    args: {
      name: "Bob",
      message: "Happy Birthday! Wishing you all the best!",
    },
  },
  {
    name: "Welcome Card",
    args: {
      name: "New User",
      message: "Welcome to our community!",
    },
  },
];
```

## Step 8: Create the View Component (Vue)

Edit `src/vue/View.vue`:

```vue
<template>
  <div v-if="greetingData" class="w-full min-h-[300px] p-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
    <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
      <!-- Card Header -->
      <div class="text-4xl mb-4">
        🎉
      </div>

      <!-- Greeting -->
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        Hello, {{ greetingData.name }}!
      </h2>

      <!-- Message -->
      <p class="text-gray-600 text-lg mb-6">
        {{ greetingData.message }}
      </p>

      <!-- Footer -->
      <div class="text-sm text-gray-400">
        Created: {{ greetingData.createdAt }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol/vue";
import type { GreetingData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult<GreetingData>;
  sendTextMessage?: (text?: string) => void;
}>();

const greetingData = ref<GreetingData | null>(null);

// Watch for result changes
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.data) {
      greetingData.value = newResult.data;
    }
  },
  { immediate: true, deep: true }
);
</script>
```

## Step 9: Create the Preview Component (Vue)

Edit `src/vue/Preview.vue`:

```vue
<template>
  <div class="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg text-center">
    <div class="text-2xl mb-1">🎉</div>
    <div class="text-sm font-medium text-purple-700 truncate">
      {{ result.data?.name || "Greeting" }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "gui-chat-protocol/vue";
import type { GreetingData } from "../core/types";

defineProps<{
  result: ToolResult<GreetingData>;
}>();
</script>
```

## Step 10: Update Exports

### src/core/index.ts

```typescript
export type { GreetingData, GreetingArgs } from "./types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, executeGreeting, pluginCore } from "./plugin";
export { SAMPLES } from "./samples";
```

### src/vue/index.ts

```typescript
import "../style.css";
import type { ToolPlugin } from "gui-chat-protocol/vue";
import type { GreetingData, GreetingArgs } from "../core/types";
import { pluginCore } from "../core/plugin";
import { SAMPLES } from "../core/samples";
import View from "./View.vue";
import Preview from "./Preview.vue";

export const plugin: ToolPlugin<GreetingData, never, GreetingArgs> = {
  ...pluginCore,
  viewComponent: View,
  previewComponent: Preview,
  samples: SAMPLES,
};

export type { GreetingData, GreetingArgs } from "../core/types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, executeGreeting, pluginCore } from "../core/plugin";
export { SAMPLES } from "../core/samples";
export { View, Preview };

export default { plugin };
```

## Step 11: Update package.json

Edit `package.json`:

```json
{
  "name": "@gui-chat-plugin/greeting",
  "description": "A greeting card plugin for GUIChat"
}
```

## Step 12: Test Your Plugin

```bash
npm run dev
```

1. Click "Simple Greeting" in Quick Samples
2. See your greeting card appear!
3. Try other samples

## Step 13: Test with Chat

In the demo:
1. Type "Create a greeting for John"
2. In Mock Mode, type "greeting John" to trigger the plugin
3. In Real API Mode (with OpenAI key), the LLM will call your tool automatically

## Troubleshooting

### View doesn't show anything

Check that:
- `TOOL_NAME` matches in definition.ts and the execute return
- `toolName` is included in the return value
- Your types are exported correctly

### Samples don't work

Check that:
- `SAMPLES` is exported from samples.ts
- Arguments match your `GreetingArgs` type
- `samples` is included in `pluginCore`

### TypeScript errors

Run:
```bash
npm run typecheck
```

Fix any type mismatches between your types and component props.

## What's Next?

1. **Add Interactivity**: Use `sendTextMessage` to send messages back to chat
2. **Add State**: Use `viewState` to persist UI state
3. **Style It**: Use Tailwind CSS for beautiful designs
4. **Publish**: Follow [npm Publishing Guide](./npm-publishing-guide.md)

## Summary

You learned how to:

1. Define a tool schema (definition.ts)
2. Create types (types.ts)
3. Implement execute function (plugin.ts)
4. Add test samples (samples.ts)
5. Build View component (View.vue)
6. Build Preview component (Preview.vue)

The key pattern is:

```
LLM calls tool → execute() returns data → View displays data
```

Congratulations on creating your first plugin!
