# Getting Started - Your First Plugin

This guide walks you through creating your first GUIChat plugin step by step. No prior plugin development experience required!

## What You'll Build

A simple "Greeting Card" plugin that:
- Takes a name as input
- Displays a personalized greeting card

## Prerequisites

- Node.js 22+ installed
- Basic knowledge of TypeScript
- Basic knowledge of Vue or React

## Big Picture: How Plugins Work

Before starting, let's understand the overall flow.

### How a Plugin Works

```
┌─────────────────────────────────────────────────────────────────┐
│ User: "Create a greeting card for Alice"                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LLM: "I'll use the greetingCard tool"                           │
│      Decides based on definition.ts info                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ execute function is called (plugin.ts)                          │
│   - Receives args: { name: "Alice" }                            │
│   - Returns ToolResult                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Displayed on screen                                             │
│   - View.vue: Main display (greeting card)                      │
│   - Preview.vue: Sidebar thumbnail                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LLM: "I've created a greeting card for Alice!"                  │
│      Responds based on ToolResult.message and instructions      │
└─────────────────────────────────────────────────────────────────┘
```

### File Dependencies

```
definition.ts ─────┐
   │               │
   │ TOOL_NAME     │ TOOL_DEFINITION
   ↓               ↓
types.ts ──────→ plugin.ts ──────→ samples.ts
   │               │
   │ Type defs     │ execute, pluginCore
   ↓               ↓
View.vue ←─────────┘
Preview.vue
```

**Dependency Flow:**
1. `definition.ts`: Define tool name and parameters (create first)
2. `types.ts`: Define data types (match definition.ts parameters)
3. `plugin.ts`: Execution logic (uses types.ts types)
4. `samples.ts`: Test data (matches types.ts types)
5. `View.vue/Preview.vue`: UI (uses types.ts types to display data)

---

## Step 1: Set Up the Project

**Purpose of this step:** Prepare the development environment

**Impact:** Foundation for all subsequent steps

```bash
# Clone the template
git clone https://github.com/receptron/GUIChatPluginTemplate.git GUIChatPluginGreeting
cd GUIChatPluginGreeting

# Install dependencies
yarn install
```

> **Why clone?**
> The template includes all configurations needed for plugin development (TypeScript, Vite, Tailwind CSS).
> It's much easier to modify this template than to start from scratch.

## Step 2: Run the Demo

**Purpose of this step:** Verify the template works correctly

**Depends on:** Step 1 (yarn install must be complete)

```bash
yarn dev
```

Open http://localhost:5173. You'll see the Quiz demo working.

**Try it:**
1. Click "Simple Quiz" button in the Quick Samples section
2. See the Quiz View appear
3. Answer the questions

> **Why try the demo?**
> Before creating your own plugin, experience how a plugin works with the existing Quiz plugin.
> This gives you a mental image of what your completed plugin will look like.

## Step 3: Understanding Mock Mode (Important)

### What is Mock Mode?

Mock Mode **mimics LLM behavior without using the actual LLM**.

```
Real API Mode:  User input → OpenAI API → Wait seconds → LLM decides → Tool call
Mock Mode:      User input → Keyword check → Instantly → Tool call
```

**Benefits of Mock Mode:**
- No API key needed (develop for free)
- Responses return instantly (no waiting)
- No API costs
- Works offline

**Start development with Mock Mode, then test with Real API Mode once it's working** - this is the recommended workflow.

The demo has two modes:

| Mode | API Key | Purpose |
|------|---------|---------|
| **Mock Mode** | Not required | For development/testing. Returns simulated LLM responses instantly based on keywords |
| **Real API Mode** | Required | For production testing. Uses actual OpenAI API (takes seconds) |

### How Mock Mode Works

```
User types message → Check for keywords → If match, trigger tool call
```

Example: User types "create a quiz"
1. Check if message contains "quiz"
2. If yes, return a mock response that calls the `putQuestions` tool
3. Plugin executes and displays in View

### Keywords Pre-configured in the Template

In Mock Mode, the system checks if your input message contains specific keywords and returns the corresponding response.

The template comes with keywords pre-configured for the Quiz plugin (`demo/shared/chat-utils.ts`):

| Words in your input | Mock Mode behavior |
|--------------------|-------------------|
| `quiz` or `question` | Calls the Quiz plugin's tool |
| `hello` or `hi` | Returns a text greeting |
| Anything else | Returns a generic text response |

**Examples:**
- Type "create a quiz" → Detects `quiz` → Quiz plugin runs
- Type "hello" → Detects `hello` → Returns "Hello! How can I help you?"
- Type "what's the weather" → No match → Generic response

### Adding Mock for Your Plugin

**This is important!** When you create a new plugin, add a mock response to test it in Mock Mode.

### What Should the Mock Response Contain?

A mock response is **data that simulates the arguments the LLM would pass when calling your tool**.

In other words, you set up the arguments that the LLM would generate based on the parameters you defined in `definition.ts`.

```
You define in definition.ts:             LLM understands:
parameters: {                            "I should pass name and message to this tool"
  name: { type: "string" },       →
  message: { type: "string" }
}

Production (Real API Mode):              Mock Mode:
User: "Create greeting for Alice"        User: "create a greeting"
    ↓                                        ↓
LLM decides and generates args:          Uses args you configured:
{ name: "Alice", message: "..." }        { name: "Alice", message: "..." }
    ↓                                        ↓
execute() is called                      execute() is called (same)
```

**In short, the mock response's `args` should contain values matching your definition.ts `parameters`.**

### How to Configure

Edit `demo/shared/chat-utils.ts`:

```typescript
export const DEFAULT_MOCK_RESPONSES: Record<string, MockResponse> = {
  // Existing quiz
  quiz: {
    toolCall: {
      name: "putQuestions",
      args: { /* ... */ },
    },
  },

  // ✏️ Add your plugin's mock
  greeting: {
    toolCall: {
      name: "greetingCard",  // Must match TOOL_NAME
      args: {
        // ⚠️ Set values for items defined in definition.ts parameters
        // Write what the LLM would generate
        name: "Alice",       // Corresponds to parameters.name
        message: "Hello!",   // Corresponds to parameters.message
      },
    },
  },

  // ...
};
```

### Correspondence with definition.ts

```typescript
// Parameters defined in definition.ts:
parameters: {
  properties: {
    name: { type: "string", description: "The name of the person to greet" },
    message: { type: "string", description: "Custom message" },
  },
  required: ["name"],
}

// ↓ Corresponding mock response args:
args: {
  name: "Alice",     // ← Corresponds to definition.ts name
  message: "Hello!", // ← Corresponds to definition.ts message
}
```

> **Why do this?**
> In Mock Mode, YOU decide "pass these arguments to this tool" instead of the LLM.
> This lets you test your plugin's behavior without using the LLM (API).

Then add keyword matching to `findMockResponse` function:

```typescript
export const findMockResponse = (
  userMessage: string,
  mockResponses: Record<string, MockResponse> = DEFAULT_MOCK_RESPONSES
): MockResponse => {
  const lowerMessage = userMessage.toLowerCase();

  // Existing
  if (lowerMessage.includes("quiz") || lowerMessage.includes("question")) {
    return mockResponses.quiz || DEFAULT_MOCK_RESPONSES.quiz;
  }

  // ✏️ Add your plugin's keywords
  if (lowerMessage.includes("greeting") || lowerMessage.includes("hello card")) {
    return mockResponses.greeting || DEFAULT_MOCK_RESPONSES.default;
  }

  // ...
};
```

### Testing in Mock Mode

1. Make sure "Mock Mode" is ON in the demo UI
2. Type "create a greeting" in the chat
3. Keyword "greeting" matches → greetingCard tool is called
4. Plugin executes and displays in View

### Switching to Real API Mode

When you want to test with actual LLM:

1. Create a `.env` file:
   ```bash
   echo "VITE_OPENAI_API_KEY=sk-your-api-key" > .env
   ```
2. Restart the demo: `yarn dev`
3. Turn OFF "Mock Mode" in the UI
4. Type naturally ("Create a greeting card for John")
5. The LLM will automatically call your tool when appropriate

## Step 4: Understand the Template

**Purpose of this step:** Know what to edit and where

**Depends on:** None (knowledge step)

Before making changes, let's understand what each file does:

```
src/
├── core/                    # Plugin logic (no UI)
│   ├── definition.ts        # ① Tool name & parameters (LLM sees this)
│   ├── types.ts            # ② TypeScript types (used everywhere)
│   ├── plugin.ts           # ③ Main execute function
│   └── samples.ts          # ④ Test data
└── vue/                     # Vue UI components
    ├── View.vue            # ⑤ Main display
    └── Preview.vue         # ⑥ Thumbnail
```

> **Edit order matters!**
> Edit in the numbered order above to avoid dependency errors.
> Example: If you don't create types.ts first, plugin.ts will have type errors.

---

## Step 5: Define Your Tool (definition.ts)

**Purpose of this step:** Tell the LLM "what this tool can do"

**Impact:**
- LLM uses this to decide when to use your tool
- **LLM reads `parameters` to understand what data is needed, then creates appropriate args**
- Those args are passed to the execute function

**Depends on:** None (create this file first)

### How the LLM Creates Args

```
User: "Create a greeting card for Alice"
                    ↓
LLM: Reads definition.ts
     1. Sees description → decides "this tool is appropriate"
     2. Sees parameters → understands "name and message are needed"
     3. Extracts values from user's message to create args
                    ↓
Args created by LLM: { name: "Alice", message: undefined }
                    ↓
execute(context, args) is called
```

In other words, **definition.ts is an instruction manual for the LLM**. The LLM reads it to:
1. Decide when to use this tool (description)
2. Understand what data to pass (parameters)
3. Extract appropriate values from the user's message and build args

### About JSON Schema

The `parameters` field is written in **JSON Schema**, a standard format for defining data structures. It's also used by OpenAI's Function Calling.

**Basic syntax:**

```typescript
parameters: {
  type: "object",           // Always "object"
  properties: {             // Property (argument) definitions
    name: {
      type: "string",       // Types: "string", "number", "boolean", "array", "object"
      description: "desc",  // LLM uses this to determine the value
    },
    age: {
      type: "number",
      description: "Age",
    },
    tags: {
      type: "array",        // For arrays
      items: { type: "string" },
      description: "List of tags",
    },
  },
  required: ["name"],       // Required arguments
}
```

**Tools for creating JSON Schema:**

| Tool | URL | Description |
|------|-----|-------------|
| Transform.tools | https://transform.tools/json-to-json-schema | Auto-generate schema from JSON samples |
| Liquid Technologies | https://www.liquid-technologies.com/online-json-to-schema-converter | Generate schema from JSON (with options) |
| JSON Schema Validator | https://www.jsonschemavalidator.net/ | Validate your schema (supports multiple draft versions) |

> **Tip:** Prepare a sample JSON of your data, then use the tools above to generate the schema automatically.

### Why is this file important?

```
User: "Create a greeting card for Alice"
                    ↓
LLM: Reads description from definition.ts
     "Create a personalized greeting card with a custom message"
     → Decides this tool is appropriate
                    ↓
LLM: Looks at parameters to build arguments
     { name: "Alice" }
```

Edit `src/core/definition.ts`:

```typescript
import type { ToolDefinition } from "gui-chat-protocol";

// Tool name (used to identify results)
// ⚠️ Important: This name must be unique. Also used in execute() return value
export const TOOL_NAME = "greetingCard";

// Tool definition for LLM
export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  // ⚠️ description: LLM reads this to decide whether to use the tool
  description: "Create a personalized greeting card with a custom message",
  parameters: {
    type: "object",
    properties: {
      // ⚠️ Parameters defined here become args in execute(context, args)
      name: {
        type: "string",
        description: "The name of the person to greet",  // LLM uses this to determine value
      },
      message: {
        type: "string",
        description: "Optional custom message",
      },
    },
    required: ["name"],  // Required parameters
  },
};

// System prompt (optional instructions for LLM)
export const SYSTEM_PROMPT = `When the user wants to create a greeting or send a message to someone, use the ${TOOL_NAME} tool.`;
```

**Key Points:**
- `TOOL_NAME`: Unique identifier for your plugin
- `description`: Tells LLM when to use this tool
- `parameters`: What inputs the tool accepts

---

## Step 6: Define Types (types.ts)

**Purpose of this step:** Define TypeScript types for consistency across all code

**Impact:**
- `plugin.ts`: Types for execute function args and return value
- `View.vue/Preview.vue`: Types for displayed data
- `samples.ts`: Types for test data

**Depends on:** Step 5 (match definition.ts parameters)

### Why are type definitions needed?

```
Defined in definition.ts:         Type definition in types.ts:
parameters: {                     interface GreetingArgs {
  name: string,             →       name: string;
  message?: string                  message?: string;
}                                 }
```

The `parameters` in definition.ts must correspond to the `Args` type in types.ts.

Edit `src/core/types.ts`:

```typescript
/**
 * Data for View/Preview components
 * Type of ToolResult.data returned by execute()
 */
export interface GreetingData {
  name: string;
  message: string;
  createdAt: string;
}

/**
 * Arguments passed to execute function
 * ⚠️ Must match parameters in definition.ts
 */
export interface GreetingArgs {
  name: string;       // required: ["name"] so this is required
  message?: string;   // Not in required, so optional (add ?)
}
```

> **What happens if types don't match?**
> - TypeScript errors
> - Data not passed correctly at runtime
> - Display errors in View component

---

## Step 7: Implement Execute Function (plugin.ts)

**Purpose of this step:** Write the logic that runs when the tool is called

**Impact:**
- Return value's `data` is passed to View.vue
- Return value's `message` and `instructions` are sent to LLM

**Depends on:**
- Step 5: Uses `TOOL_NAME`
- Step 6: Uses `GreetingData`, `GreetingArgs` types

### What is the Execute Function?

The Execute function is **the heart of your plugin**. It runs when the LLM calls your tool.

```
LLM decides "I'll use the greetingCard tool"
    ↓
execute(context, args) is called
    ↓
Returns ToolResult
    ↓
Displayed in View/Preview components
    ↓
Result is also sent to LLM for next response
```

### Execute Function Arguments

```typescript
execute(context: ToolContext, args: GreetingArgs): Promise<ToolResult>
```

| Argument | Description |
|----------|-------------|
| `context` | Execution context. Contains `currentResult` (previous result), etc. |
| `args` | Arguments from LLM. Based on parameters defined in definition.ts |

### ToolResult Structure (Return Value)

```typescript
interface ToolResult<T, J> {
  toolName: string;      // Required: Must match TOOL_NAME
  message: string;       // Required: Brief status for LLM
  data?: T;              // UI-only data (used by View component)
  jsonData?: J;          // Data visible to LLM (used for response generation)
  title?: string;        // Result title (shown in sidebar)
  instructions?: string; // Instructions for LLM ("Tell the user...", etc.)
}
```

**Important Difference:**
- `data`: Used only by View component. NOT sent to LLM (can be large)
- `jsonData`: Sent to LLM. LLM sees this data when generating its response

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
  _context: ToolContext,  // Not used here, so prefix with _
  args: GreetingArgs,     // Arguments from LLM
): Promise<ToolResult<GreetingData, never>> => {
  const { name, message } = args;

  // Create greeting data
  const greetingData: GreetingData = {
    name,
    message: message || `Hello, ${name}! Welcome!`,
    createdAt: new Date().toLocaleString(),
  };

  return {
    toolName: TOOL_NAME,  // Required! Must match TOOL_NAME from definition.ts
    message: `Greeting card created for ${name}`,  // Report to LLM
    data: greetingData,   // For View component
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

### pluginCore Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `toolDefinition` | ✅ | Tool definition for LLM (imported from definition.ts) |
| `execute` | ✅ | Tool execution function |
| `generatingMessage` | | Message displayed while executing |
| `isEnabled` | | Function returning whether tool is enabled. `() => true` = always enabled |
| `systemPrompt` | | Text added to LLM's system prompt |
| `samples` | | Test data shown in Quick Samples |

**Common Mistake:**
```typescript
// ❌ Wrong - missing toolName
return {
  message: "Completed",
  data: greetingData,
};

// ✅ Correct - toolName is required
return {
  toolName: TOOL_NAME,  // Without this, View won't display!
  message: "Completed",
  data: greetingData,
};
```

## Step 8: Add Test Samples (samples.ts)

**Purpose of this step:** Define test data for Quick Samples buttons

**Impact:** Buttons appear in the "Quick Samples" section of the demo

**Depends on:** Step 6 (must match GreetingArgs type)

### What are Samples?

> **Important:** samples.ts is **only used in this demo environment**.
> It is NOT used in production apps like MulmoChat.

Samples are data that **emulate the arguments the LLM would pass when calling your tool**.

```
Production (MulmoChat):
  User: "Create a greeting for Alice"
      ↓
  LLM: Calls greetingCard tool
      ↓
  execute({ name: "Alice" })  ← LLM decides the arguments

Demo (this template):
  Click Quick Samples button
      ↓
  execute({ name: "Alice" })  ← Uses arguments from samples.ts
```

In other words, it's a mechanism to **test your plugin without the LLM**.

```
Quick Samples in demo:
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Simple Greeting │ │ Custom Message  │ │ Welcome Card    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
        ↓ Click
execute({ name: "Alice" }) is called (directly, bypassing LLM)
```

Edit `src/core/samples.ts`:

```typescript
import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "Simple Greeting",  // Name shown on button
    args: {
      // ⚠️ Must match GreetingArgs type
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

> **Samples not working?**
> Check that the `args` content matches your `GreetingArgs` type.

---

## Step 9: Create the View Component (Vue)

**Purpose of this step:** Create the main UI for your plugin

**Impact:** execute()'s result is displayed here

**Depends on:**
- Step 5: Uses `TOOL_NAME` to filter results
- Step 6: Uses `GreetingData` type to receive data
- Step 7: Receives `data` returned by `execute()`

### View Component Data Flow

```
execute() returns:              View.vue receives:
{                               props.selectedResult
  toolName: "greetingCard",       │
  data: {                         ↓
    name: "Alice",        →    greetingData = {
    message: "...",              name: "Alice",
    createdAt: "..."             message: "...",
  }                              createdAt: "..."
}                              }
```

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

## Step 10: Create the Preview Component (Vue)

**Purpose of this step:** Create a small thumbnail for the sidebar

**Impact:** Shown in the sidebar results list

**Depends on:** Step 6 (uses GreetingData type)

### What is Preview?

```
┌──────────────────────────────────────────────────────────┐
│ Sidebar                      │        Main Screen        │
│ ┌─────────────┐              │                           │
│ │ 🎉          │ ← Preview    │   ┌───────────────────┐   │
│ │ Alice       │              │   │                   │   │
│ └─────────────┘              │   │   View.vue        │   │
│ ┌─────────────┐              │   │   content         │   │
│ │ 🎉          │              │   │                   │   │
│ │ Bob         │              │   └───────────────────┘   │
│ └─────────────┘              │                           │
└──────────────────────────────────────────────────────────┘
```

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
  result: ToolResult<GreetingData>;  // Receives entire return value from execute()
}>();
</script>
```

> **Keep Preview simple!**
> It's a thumbnail, so only show minimal information.

---

## Step 11: Update Exports

**Purpose of this step:** Make created modules available for external use

**Impact:** Other projects can import your plugin after npm publish

**Depends on:** All of Steps 5-10 (bundles all modules)

### Why are exports needed?

```
When used from MulmoChat:
import Plugin from "guichat-plugin-greeting/vue";
                                      ↑
                            Exports from src/vue/index.ts
```

🚫 **This file usually doesn't need editing.** Use the template as-is.

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

---

## Step 12: Update package.json

**Purpose of this step:** Set the package name

**Impact:** This becomes your npm package name

**Depends on:** None

Edit `package.json`:

```json
{
  "name": "guichat-plugin-greeting",
  "description": "A greeting card plugin for GUIChat"
}
```

> **Naming convention**
> Starting with `guichat-plugin-` gives consistency with other GUIChat plugins.

---

## Step 13: Test Your Plugin

**Purpose of this step:** Verify with Quick Samples

**Depends on:** All Steps 1-11 must be complete

```bash
yarn dev
```

1. Click "Simple Greeting" in Quick Samples
2. See your greeting card appear!
3. Try other samples

## Step 14: Test with Chat

**Purpose of this step:** Test with chat-like interaction

**Depends on:**
- Step 13 is successful
- Understanding Mock Mode from Step 3

### Difference from Quick Samples

```
Quick Samples:     Button click → execute() runs immediately
Mock Mode Chat:    Text input → Keyword match → execute() runs
Real API Mode:     Text input → LLM decides → execute() runs
```

Use Mock Mode as explained in Step 3:

1. Add the greeting mock response to `demo/shared/chat-utils.ts` (see Step 3)
2. Make sure "Mock Mode" is ON in the demo UI
3. Type "create a greeting" in the chat
4. Your greeting card appears!

To test with Real API Mode, see "Switching to Real API Mode" in Step 3.

---

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
yarn typecheck
```

Fix any type mismatches between your types and component props.

### Lint errors

Check code style issues:
```bash
yarn lint
```

ESLint will point out code problems. Fix any errors or warnings shown.

## What's Next?

1. **Add Interactivity**: Use `sendTextMessage` to send messages back to chat
2. **Add State**: Use `viewState` to persist UI state
3. **Style It**: Use Tailwind CSS for beautiful designs
4. **Publish**: Follow [npm Publishing Guide](./npm-publishing-guide.md)

## Integration with MulmoChat

After developing your plugin, to use it in MulmoChat:

1. Publish to npm or use local path
2. Install in MulmoChat:
   ```bash
   yarn add guichat-plugin-greeting
   ```
3. Import in MulmoChat's `src/tools/index.ts`:
   ```typescript
   import GreetingPlugin from "guichat-plugin-greeting/vue";

   export const plugins = [
     // ... other plugins
     GreetingPlugin,
   ];
   ```
4. Import CSS in MulmoChat's `src/main.ts`:
   ```typescript
   import "guichat-plugin-greeting/style.css";
   ```

See [npm Publishing Guide](./npm-publishing-guide.md) for details.

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
