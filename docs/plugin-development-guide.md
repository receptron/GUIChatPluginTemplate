# GUIChat Plugin Development Guide

Complete reference for developing GUIChat plugins. This guide covers all aspects of plugin development from basic to advanced patterns.

## Table of Contents

1. [Key Innovation](#key-innovation)
2. [Architecture Overview](#architecture-overview)
3. [Type System](#type-system)
4. [Directory Structure](#directory-structure)
5. [Core Implementation](#core-implementation)
6. [UI Components](#ui-components)
7. [Advanced Patterns](#advanced-patterns)
8. [Plugin Configuration](#plugin-configuration)
9. [External API Key Integration](#external-api-key-integration)
10. [Testing](#testing)
11. [Checklist](#checklist)

---

## Key Innovation

**GUIChat extends OpenAI's function calling mechanism to enable direct GUI communication between plugins and users.**

Traditional function calling systems follow this pattern:
```
User → AI → Function Call → Backend → JSON Response → AI → User
```

GUIChat's innovation adds a **visual layer** to this flow:
```
User → AI → Function Call → Plugin Execution → Rich GUI Result → User
                    ↓
                AI receives JSON summary for context
```

**What this means:**
- **Dual Output:** Each plugin returns both machine-readable data (for the AI) and human-readable UI (for the user)
- **Rich Interactions:** Users see images, maps, interactive games, videos—not just text
- **Persistent Results:** Plugin outputs remain visible in the sidebar and can be re-selected
- **Visual Context:** The AI knows what the user is seeing and can reference it naturally
- **Bidirectional Communication:** Users can interact with plugin UIs while conversing with the AI

**Example:** When the AI calls `generateImage("sunset over mountains")`:
1. Plugin generates the image
2. **User sees:** Full-resolution image rendered on canvas
3. **AI receives:** `"Image generated successfully and displayed to user"`
4. Conversation continues with both parties aware of the visual context

This architecture transforms function calling from a backend integration pattern into a **multimodal user experience**.

---

## Architecture Overview

### How Plugins Work

```
User Input → LLM → Tool Call → execute() → ToolResult → View/Preview
     ↑                                                        │
     └──────────── instructions to LLM ←──────────────────────┘
```

1. User speaks or types a request
2. LLM decides which tool to call
3. Plugin's `execute()` function runs with arguments
4. Returns `ToolResult` with data
5. View/Preview components display the result
6. Optional `instructions` guide LLM's next response

### Component Roles

| Component | Role | Location |
|-----------|------|----------|
| **Tool Definition** | Schema for LLM | `src/core/definition.ts` |
| **Execute Function** | Main logic | `src/core/plugin.ts` |
| **View** | Full display on canvas | `src/vue/View.vue` |
| **Preview** | Thumbnail in sidebar | `src/vue/Preview.vue` |

---

## Type System

### gui-chat-protocol Package

```bash
npm install gui-chat-protocol
```

```typescript
// Core types (framework-agnostic)
import { ToolPluginCore, ToolResult, ToolContext, ToolDefinition } from "gui-chat-protocol";

// Vue types
import { ToolPlugin } from "gui-chat-protocol/vue";

// React types
import { ToolPluginReact } from "gui-chat-protocol/react";
```

### ToolPluginCore

```typescript
interface ToolPluginCore<T, J, A> {
  toolDefinition: ToolDefinition;    // Tool schema for LLM
  execute: (context: ToolContext, args: A) => Promise<ToolResult<T, J>>;
  generatingMessage: string;          // Shown while executing
  waitingMessage?: string;            // Sent to LLM before result
  isEnabled: () => boolean;           // Enable/disable check
  systemPrompt?: string;              // Additional LLM instructions
  samples?: ToolSample[];             // Test samples
  backends?: BackendType[];           // Required backends
  inputHandlers?: InputHandler[];     // File/clipboard handlers
}
```

### Type Parameters

```typescript
ToolPlugin<T, J, A>
//        │  │  └── A: Argument type (from LLM)
//        │  └───── J: JSON data (returned to LLM)
//        └──────── T: Data type (for UI, not sent to LLM)
```

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `T` | UI data (View/Preview) | `QuizData`, `GameState` |
| `J` | Data for LLM | `{ success: boolean }` |
| `A` | Execute arguments | `{ name: string }` |

### ToolResult

```typescript
interface ToolResult<T, J> {
  toolName: string;            // Must match TOOL_NAME
  message: string;              // Status for LLM (required)
  data?: T;                     // UI data (not sent to LLM)
  jsonData?: J;                 // Data returned to LLM
  title?: string;               // Result title
  instructions?: string;        // Tell LLM what to say
  instructionsRequired?: boolean; // Always send instructions
  updating?: boolean;           // Update existing result
  viewState?: Record<string, unknown>; // Persistent UI state
}
```

### ToolContext

```typescript
interface ToolContext {
  currentResult?: ToolResult | null;  // Currently selected result
  app?: ToolContextApp;               // Host app features
}
```

---

## Directory Structure

```
GUIChatPluginXxx/
├── package.json              # npm configuration
├── tsconfig.json             # TypeScript config
├── tsconfig.build.json       # Build TypeScript config
├── vite.config.ts            # Vite build config
├── eslint.config.js          # ESLint config
├── index.html                # Demo HTML
├── README.md
├── .gitignore
├── src/
│   ├── index.ts              # Main entry (re-exports core)
│   ├── style.css             # Tailwind import
│   ├── core/                 # Framework-agnostic
│   │   ├── index.ts          # Core exports
│   │   ├── types.ts          # Type definitions
│   │   ├── definition.ts     # Tool definition
│   │   ├── plugin.ts         # Execute function
│   │   ├── samples.ts        # Test samples
│   │   └── logic.ts          # Business logic (optional)
│   ├── vue/                  # Vue components
│   │   ├── index.ts          # Vue plugin exports
│   │   ├── View.vue          # Main view
│   │   └── Preview.vue       # Thumbnail
│   └── react/                # React components
│       ├── index.ts          # React plugin exports
│       ├── View.tsx          # Main view
│       └── Preview.tsx       # Thumbnail
└── demo/
    ├── vue/                  # Vue demo
    ├── react/                # React demo
    └── shared/               # Shared utilities
```

---

## Core Implementation

### Step 1: Types (types.ts)

```typescript
/**
 * Data for View/Preview (not sent to LLM)
 */
export interface XxxToolData {
  content: string;
  items: string[];
}

/**
 * Arguments from LLM
 */
export interface XxxArgs {
  prompt: string;
  count?: number;
}

/**
 * Data returned to LLM (optional)
 */
export interface XxxJsonData {
  success: boolean;
  itemCount: number;
}
```

### Step 2: Definition (definition.ts)

```typescript
import type { ToolDefinition } from "gui-chat-protocol";

// Use namespace:toolname format (e.g., "receptron:quiz", "myorg:xxx")
export const TOOL_NAME = "yournamespace:xxxTool";

export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description: "Clear description of when LLM should use this tool",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "What the user wants",
      },
      count: {
        type: "number",
        description: "Number of items (optional)",
      },
    },
    required: ["prompt"],
  },
};

export const SYSTEM_PROMPT = `When users want to do X, use the ${TOOL_NAME} tool.`;
```

### Step 3: Samples (samples.ts)

```typescript
import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "Basic Example",
    args: { prompt: "test" },
  },
  {
    name: "With Count",
    args: { prompt: "test", count: 5 },
  },
];
```

### Step 4: Execute Function (plugin.ts)

```typescript
import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";
import type { XxxToolData, XxxArgs, XxxJsonData } from "./types";
import { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT } from "./definition";
import { SAMPLES } from "./samples";

export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT } from "./definition";

export const executeXxx = async (
  _context: ToolContext,
  args: XxxArgs,
): Promise<ToolResult<XxxToolData, XxxJsonData>> => {
  const { prompt, count = 3 } = args;

  // Your logic here
  const items = Array.from({ length: count }, (_, i) => `Item ${i + 1}: ${prompt}`);

  return {
    toolName: TOOL_NAME,
    message: `Created ${count} items`,
    data: { content: prompt, items },
    jsonData: { success: true, itemCount: count },
    instructions: "Tell the user the items have been created.",
  };
};

export const pluginCore: ToolPluginCore<XxxToolData, XxxJsonData, XxxArgs> = {
  toolDefinition: TOOL_DEFINITION,
  execute: executeXxx,
  generatingMessage: "Creating...",
  isEnabled: () => true,
  systemPrompt: SYSTEM_PROMPT,
  samples: SAMPLES,
};
```

### Step 5: Core Exports (index.ts)

```typescript
export type { XxxToolData, XxxArgs, XxxJsonData } from "./types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, executeXxx, pluginCore } from "./plugin";
export { SAMPLES } from "./samples";
```

---

## UI Components

### Vue View Component

```vue
<template>
  <div v-if="data" class="w-full p-4 bg-white rounded-lg">
    <h2 class="text-xl font-bold mb-4">{{ data.content }}</h2>
    <ul class="space-y-2">
      <li v-for="(item, index) in data.items" :key="index" class="p-2 bg-gray-100 rounded">
        {{ item }}
      </li>
    </ul>

    <!-- User interaction example -->
    <button
      @click="handleAction"
      class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
    >
      Send to Chat
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol/vue";
import type { XxxToolData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult<XxxToolData>;
  sendTextMessage?: (text?: string) => void;
  onUpdateResult?: (updates: Partial<ToolResult>) => void;
}>();

const data = ref<XxxToolData | null>(null);

watch(
  () => props.selectedResult,
  (result) => {
    if (result?.toolName === TOOL_NAME && result.data) {
      data.value = result.data;
    }
  },
  { immediate: true, deep: true }
);

const handleAction = () => {
  // Send message to chat
  props.sendTextMessage?.("User clicked the button");
};
</script>
```

### Vue Preview Component

```vue
<template>
  <div class="p-4 bg-blue-50 rounded text-center">
    <div class="text-2xl mb-1">📋</div>
    <div class="text-sm text-blue-700 truncate">
      {{ result.title || result.data?.content || "Untitled" }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "gui-chat-protocol/vue";
import type { XxxToolData } from "../core/types";

defineProps<{
  result: ToolResult<XxxToolData>;
}>();
</script>
```

### Vue Plugin Exports (vue/index.ts)

```typescript
import "../style.css";
import type { ToolPlugin } from "gui-chat-protocol/vue";
import type { XxxToolData, XxxArgs, XxxJsonData } from "../core/types";
import { pluginCore } from "../core/plugin";
import { SAMPLES } from "../core/samples";
import View from "./View.vue";
import Preview from "./Preview.vue";

export const plugin: ToolPlugin<XxxToolData, XxxJsonData, XxxArgs> = {
  ...pluginCore,
  viewComponent: View,
  previewComponent: Preview,
  samples: SAMPLES,
};

export type { XxxToolData, XxxArgs, XxxJsonData } from "../core/types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, executeXxx, pluginCore } from "../core/plugin";
export { SAMPLES } from "../core/samples";
export { View, Preview };

export default { plugin };
```

### React View Component

```tsx
import { useState, useEffect } from "react";
import type { ViewComponentProps } from "gui-chat-protocol";
import type { XxxToolData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

type ViewProps = ViewComponentProps<never, XxxToolData>;

export function View({ selectedResult, sendTextMessage }: ViewProps) {
  const [data, setData] = useState<XxxToolData | null>(null);

  useEffect(() => {
    if (selectedResult?.toolName === TOOL_NAME && selectedResult.data) {
      setData(selectedResult.data);
    }
  }, [selectedResult]);

  if (!data) return null;

  const handleAction = () => {
    sendTextMessage("User clicked the button");
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">{data.content}</h2>
      <ul className="space-y-2">
        {data.items.map((item, index) => (
          <li key={index} className="p-2 bg-gray-100 rounded">
            {item}
          </li>
        ))}
      </ul>
      <button
        onClick={handleAction}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Send to Chat
      </button>
    </div>
  );
}
```

---

## Advanced Patterns

### Pattern 1: Updating Existing Result

When you want to update the current result instead of creating a new one:

```typescript
export const executeUpdate = async (
  context: ToolContext,
  args: UpdateArgs,
): Promise<ToolResult> => {
  if (!context.currentResult) {
    return { toolName: TOOL_NAME, message: "No result to update" };
  }

  return {
    ...context.currentResult,
    toolName: TOOL_NAME,
    message: "Updated successfully",
    updating: true,  // Key: Don't create new result
    viewState: {
      ...context.currentResult.viewState,
      lastUpdated: Date.now(),
    },
  };
};
```

### Pattern 2: Interactive Games

For games like Othello, use `jsonData` to send game state to LLM:

```typescript
export const executeGame = async (
  _context: ToolContext,
  args: GameArgs,
): Promise<ToolResult<never, GameState>> => {
  const state = playGame(args);

  const isComputerTurn = state.currentPlayer === "computer";

  return {
    toolName: TOOL_NAME,
    message: `Move played at ${args.position}`,
    jsonData: state,  // Game state for LLM
    instructions: isComputerTurn
      ? "It's your turn. Choose your next move."
      : "Tell the user to make a move.",
    instructionsRequired: isComputerTurn,
    updating: args.action !== "new_game",
  };
};
```

### Pattern 3: User Interaction with sendTextMessage

View components can send messages back to chat:

```vue
<script setup lang="ts">
const props = defineProps<{
  selectedResult: ToolResult;
  sendTextMessage?: (text?: string) => void;
}>();

const handleClick = (row: number, col: number) => {
  // Send user action to chat
  props.sendTextMessage?.(`I want to play at position ${row}, ${col}`);
};
</script>
```

### Pattern 4: Persistent View State

Save UI state that persists across result switches:

```typescript
// In execute function
return {
  toolName: TOOL_NAME,
  message: "Success",
  data: myData,
  viewState: {
    scrollPosition: 0,
    selectedTab: "overview",
  },
};
```

```vue
<script setup lang="ts">
// In View component
const props = defineProps<{
  selectedResult: ToolResult;
  onUpdateResult?: (updates: Partial<ToolResult>) => void;
}>();

// Restore state
const scrollPosition = props.selectedResult.viewState?.scrollPosition || 0;

// Save state
const updateState = (newPosition: number) => {
  props.onUpdateResult?.({
    viewState: {
      ...props.selectedResult.viewState,
      scrollPosition: newPosition,
    },
  });
};
</script>
```

### Pattern 5: File Input Handlers

Accept file uploads or clipboard paste:

```typescript
export const pluginCore: ToolPluginCore = {
  // ... other properties
  inputHandlers: [
    {
      type: "file",
      acceptedTypes: ["image/png", "image/jpeg"],
      handleInput: (data: string, fileName?: string) => ({
        toolName: TOOL_NAME,
        data: { imageData: data },
        message: "Image uploaded",
        title: fileName || "Uploaded Image",
      }),
    },
    {
      type: "clipboard-image",
      handleInput: (data: string) => ({
        toolName: TOOL_NAME,
        data: { imageData: data },
        message: "Image pasted",
      }),
    },
  ],
};
```

---

## Plugin Configuration

Add user-configurable settings to your plugin. This is useful when you want users to customize plugin behavior through a settings UI.

> **Note:** Plugin configuration is a host app feature. The examples below show how MulmoChat implements this. Your host app may implement configuration differently.

### Step 1: Create Config Component

Create a Vue component for your configuration UI:

```vue
<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Temperature Unit
    </label>
    <select
      :value="value"
      @change="$emit('update:value', ($event.target as HTMLSelectElement).value)"
      class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="celsius">Celsius (°C)</option>
      <option value="fahrenheit">Fahrenheit (°F)</option>
    </select>
    <p class="text-xs text-gray-500 mt-1">
      Choose your preferred temperature unit.
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ value: "celsius" | "fahrenheit" }>();
defineEmits<{ "update:value": [value: "celsius" | "fahrenheit"] }>();
</script>
```

**Requirements:**
- Props: `{ value: T }` - Current config value
- Emits: `{ 'update:value': [newValue: T] }` - Value change events

### Step 2: Add Config to Plugin

```typescript
import ConfigComponent from "./ConfigComponent.vue";

export const plugin: ToolPlugin<MyData, MyJsonData, MyArgs> = {
  // ... other properties
  config: {
    key: "myConfigKey",           // Storage key (unique per plugin)
    defaultValue: "default",      // Default value
    component: ConfigComponent,   // Vue component
  },
};
```

### Step 3: Use Config in Execute Function

Access the configuration value through `context`:

```typescript
const execute = async (
  context: ToolContext,
  args: MyArgs,
): Promise<ToolResult<MyData, MyJsonData>> => {
  // Get user's configured value
  const configValue = context.getPluginConfig?.("myConfigKey") || "default";

  // Use configValue in your logic
  const result = processWithConfig(args, configValue);

  return {
    toolName: TOOL_NAME,
    message: "Success",
    data: result,
  };
};
```

**How it works (in MulmoChat):**
- Configs are automatically saved to `localStorage` under key `plugin_configs_v1`
- The value is accessible via `context.getPluginConfig(key)`
- The config UI is automatically rendered in the settings modal

---

## External API Key Integration

When your plugin requires an external API key (e.g., Google Maps, weather services), you need to:
1. Check if the API key is available using `isEnabled`
2. Receive the API key as a prop in your View component

### Step 1: Update isEnabled in plugin.ts

The `isEnabled` function receives `startResponse` from the host app, which contains available API keys:

```typescript
import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";

// Define the StartResponse type with your API key
interface StartResponse {
  myServiceApiKey?: string;
  // ... other keys
}

export const pluginCore: ToolPluginCore<MyData, MyJsonData, MyArgs> = {
  toolDefinition: TOOL_DEFINITION,
  execute: executeMyTool,
  generatingMessage: "Processing...",
  // Plugin is enabled only when API key is available
  isEnabled: (startResponse?: StartResponse | null) => !!startResponse?.myServiceApiKey,
  systemPrompt: SYSTEM_PROMPT,
  samples: SAMPLES,
};
```

### Step 2: Receive API Key in View Component (Vue)

```vue
<script setup lang="ts">
import type { ToolResult } from "gui-chat-protocol/vue";

const props = defineProps<{
  selectedResult: ToolResult<MyData>;
  myServiceApiKey?: string | null;  // Receive API key as prop
}>();

// Use the API key
const apiUrl = computed(() =>
  `https://api.myservice.com/data?key=${props.myServiceApiKey}`
);
</script>
```

### Step 3: Host App Configuration (MulmoChat Example)

The host app needs to:

**1. Read API key from environment variable (server/routes/api.ts):**

```typescript
// Read from environment
const myServiceApiKey = process.env.MY_SERVICE_API_KEY;

// Include in start response
app.get("/api/start", (req, res) => {
  res.json({
    // ... other config
    myServiceApiKey,
  });
});
```

**2. Define in server types (server/types.ts):**

```typescript
export interface StartApiResponse {
  // ... other fields
  myServiceApiKey: string | undefined;
}
```

**3. Pass to plugin View component (src/views/HomeView.vue):**

```vue
<component
  :is="getToolPlugin(selectedResult.toolName!).viewComponent"
  :selected-result="selectedResult"
  :my-service-api-key="startResponse?.myServiceApiKey || null"
/>
```

### Real Example: Google Maps API

Here's how the Google Maps plugin integrates:

**Plugin side (plugin.ts):**
```typescript
isEnabled: (startResponse) => !!startResponse?.googleMapKey,
```

**View component receives:**
```vue
<script setup>
const props = defineProps<{
  googleMapKey?: string | null;
}>();
</script>
```

**MulmoChat passes:**
```vue
<component :google-map-key="startResponse?.googleMapKey || null" />
```

### Summary

| Location | Action |
|----------|--------|
| Plugin `plugin.ts` | Check `startResponse?.apiKey` in `isEnabled` |
| Plugin `View.vue` | Add `apiKey` prop |
| Host `server/routes/api.ts` | Read `process.env.API_KEY` |
| Host `server/types.ts` | Add `apiKey` to `StartApiResponse` |
| Host `HomeView.vue` | Pass `:api-key="startResponse?.apiKey"` |

---

## Testing

### Run Development Server

```bash
# Vue demo
npm run dev

# React demo
npm run dev:react
```

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
```

---

## Important Notes

### ⚠️ No Tailwind Arbitrary Values

Do NOT use Tailwind's arbitrary values (JIT syntax) in plugin code:

```html
<!-- ✅ Good: Standard Tailwind classes -->
<div class="bg-slate-900 w-48 p-4">

<!-- ❌ Bad: Arbitrary values - will NOT work in MulmoChat -->
<div class="bg-[#1a1a2e] w-[137px] p-[10px]">
```

MulmoChat uses Tailwind's `@source` directive to scan plugin dist files. This only works with standard Tailwind classes. If you need custom values, define them in your plugin's `style.css` or use inline styles.

---

## Checklist

### Required Files

- [ ] `package.json` - name, description updated
- [ ] `vite.config.ts` - name updated
- [ ] `tsconfig.json`
- [ ] `tsconfig.build.json`
- [ ] `README.md` - Plugin documentation

### Core Files

- [ ] `src/core/types.ts` - Data and Args types
- [ ] `src/core/definition.ts` - TOOL_NAME, TOOL_DEFINITION
- [ ] `src/core/plugin.ts` - execute function, pluginCore
- [ ] `src/core/samples.ts` - Test samples
- [ ] `src/core/index.ts` - Exports

### Vue Files (if using Vue)

- [ ] `src/vue/View.vue` - Main component
- [ ] `src/vue/Preview.vue` - Thumbnail
- [ ] `src/vue/index.ts` - Plugin exports

### React Files (if using React)

- [ ] `src/react/View.tsx` - Main component
- [ ] `src/react/Preview.tsx` - Thumbnail
- [ ] `src/react/index.ts` - Plugin exports

### Build Verification

- [ ] `npm install` succeeds
- [ ] `npm run typecheck` no errors
- [ ] `npm run lint` no errors
- [ ] `npm run build` succeeds
- [ ] `npm run dev` demo works
- [ ] Samples display correctly
- [ ] View component renders data
- [ ] Preview component shows thumbnail

---

## Next Steps

- [AI Development Guide](./ai-development-guide.md) - For AI-assisted development
- [npm Publishing Guide](./npm-publishing-guide.md) - Publish your plugin
