# AI Development Guide

This document is optimized for AI coding assistants (Claude, GPT, etc.) to create GUIChat plugins efficiently.

## Quick Reference

### Plugin Structure (Required Files)

```
src/
├── core/
│   ├── types.ts        # TypeScript interfaces
│   ├── definition.ts   # TOOL_NAME, TOOL_DEFINITION
│   ├── plugin.ts       # execute function, pluginCore
│   ├── samples.ts      # Test samples
│   └── index.ts        # Exports
├── vue/
│   ├── View.vue        # Main UI
│   ├── Preview.vue     # Thumbnail
│   └── index.ts        # Vue plugin
└── react/
    ├── View.tsx        # Main UI
    ├── Preview.tsx     # Thumbnail
    └── index.ts        # React plugin
```

### Critical Requirements

1. **TOOL_NAME must match** in definition.ts and execute return
2. **toolName property required** in ToolResult return
3. **Types must be exported** from core/index.ts
4. **style.css import** must be at top of vue/index.ts and react/index.ts

---

## Template: Create New Plugin

Use this prompt template with specifications:

```
Create a GUIChat plugin based on GUIChatPluginTemplate.

Plugin name: guichat-plugin-{name}
Function: {detailed description}

Tool Definition:
- name: {toolName}
- description: {LLM-facing description}
- parameters:
  - {paramName} ({type}): {description} [required/optional]

Implementation:
- Data type (T): {fields for UI display}
- JSON data (J): {fields returned to LLM, or "never"}
- View: {what to display, interactions}
- Preview: {thumbnail content}
- Samples: {2-3 test cases}
```

---

## Implementation Patterns

### Pattern A: Simple Data Display (Like Quiz)

```typescript
// types.ts
export interface SimpleData {
  title: string;
  items: string[];
}
export interface SimpleArgs {
  prompt: string;
}

// plugin.ts
export const executeSimple = async (
  _context: ToolContext,
  args: SimpleArgs,
): Promise<ToolResult<SimpleData, never>> => {
  return {
    toolName: TOOL_NAME,
    message: "Created successfully",
    data: { title: args.prompt, items: ["Item 1", "Item 2"] },
    instructions: "Tell the user the content is ready.",
  };
};
```

### Pattern B: Interactive with JSON (Like Othello)

```typescript
// types.ts
export interface GameState {
  board: string[][];
  currentPlayer: "user" | "computer";
  isOver: boolean;
}
export interface GameArgs {
  action: "new" | "move";
  position?: { row: number; col: number };
}

// plugin.ts
export const executeGame = async (
  context: ToolContext,
  args: GameArgs,
): Promise<ToolResult<never, GameState>> => {
  const state = computeGameState(args, context.currentResult);

  return {
    toolName: TOOL_NAME,
    message: `Action: ${args.action}`,
    jsonData: state,  // Sent to LLM
    instructions: state.currentPlayer === "computer"
      ? "Choose your next move."
      : "Wait for user's move.",
    instructionsRequired: state.currentPlayer === "computer",
    updating: args.action !== "new",
  };
};
```

### Pattern C: Update Existing Result

```typescript
// plugin.ts
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
    updating: true,
    viewState: {
      ...context.currentResult.viewState,
      scrollTo: args.target,
    },
  };
};
```

---

## File Templates

### src/core/types.ts

```typescript
/**
 * Data for View/Preview components (not sent to LLM)
 */
export interface {Name}Data {
  // UI display fields
}

/**
 * Arguments from LLM
 */
export interface {Name}Args {
  // Tool parameters
}

/**
 * Data returned to LLM (optional, use 'never' if not needed)
 */
export interface {Name}JsonData {
  success: boolean;
  // Additional fields for LLM
}
```

### src/core/definition.ts

```typescript
import type { ToolDefinition } from "gui-chat-protocol";

// Use namespace:toolname format (e.g., "receptron:quiz")
export const TOOL_NAME = "{namespace}:{toolName}";

export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description: "{Clear description for LLM}",
  parameters: {
    type: "object",
    properties: {
      // Define each parameter
    },
    required: [/* required params */],
  },
};

export const SYSTEM_PROMPT = `{Instructions for when to use this tool}`;
```

### src/core/plugin.ts

```typescript
import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";
import type { {Name}Data, {Name}Args, {Name}JsonData } from "./types";
import { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT } from "./definition";
import { SAMPLES } from "./samples";

export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT } from "./definition";

export const execute{Name} = async (
  _context: ToolContext,
  args: {Name}Args,
): Promise<ToolResult<{Name}Data, {Name}JsonData>> => {
  // Implementation

  return {
    toolName: TOOL_NAME,
    message: "Success message for LLM",
    data: {/* UI data */},
    jsonData: {/* LLM data, optional */},
    instructions: "What LLM should say next",
  };
};

export const pluginCore: ToolPluginCore<{Name}Data, {Name}JsonData, {Name}Args> = {
  toolDefinition: TOOL_DEFINITION,
  execute: execute{Name},
  generatingMessage: "Processing...",
  isEnabled: () => true,
  systemPrompt: SYSTEM_PROMPT,
  samples: SAMPLES,
};
```

### src/core/samples.ts

```typescript
import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "Sample 1",
    args: {/* sample args */},
  },
  {
    name: "Sample 2",
    args: {/* sample args */},
  },
];
```

### src/core/index.ts

```typescript
export type { {Name}Data, {Name}Args, {Name}JsonData } from "./types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, execute{Name}, pluginCore } from "./plugin";
export { SAMPLES } from "./samples";
```

### src/vue/View.vue

```vue
<template>
  <div v-if="data" class="w-full p-4">
    <!-- Your UI here -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol/vue";
import type { {Name}Data } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult<{Name}Data>;
  sendTextMessage?: (text?: string) => void;
  onUpdateResult?: (updates: Partial<ToolResult>) => void;
}>();

const data = ref<{Name}Data | null>(null);

watch(
  () => props.selectedResult,
  (result) => {
    if (result?.toolName === TOOL_NAME && result.data) {
      data.value = result.data;
    }
  },
  { immediate: true, deep: true }
);
</script>
```

### src/vue/Preview.vue

```vue
<template>
  <div class="p-4 bg-blue-50 rounded text-center">
    <div class="text-xl mb-1">{emoji}</div>
    <div class="text-sm text-blue-700 truncate">
      {{ result.title || "Untitled" }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "gui-chat-protocol/vue";
import type { {Name}Data } from "../core/types";

defineProps<{
  result: ToolResult<{Name}Data>;
}>();
</script>
```

### src/vue/index.ts

```typescript
import "../style.css";
import type { ToolPlugin } from "gui-chat-protocol/vue";
import type { {Name}Data, {Name}Args, {Name}JsonData } from "../core/types";
import { pluginCore } from "../core/plugin";
import { SAMPLES } from "../core/samples";
import View from "./View.vue";
import Preview from "./Preview.vue";

export const plugin: ToolPlugin<{Name}Data, {Name}JsonData, {Name}Args> = {
  ...pluginCore,
  viewComponent: View,
  previewComponent: Preview,
  samples: SAMPLES,
};

export type { {Name}Data, {Name}Args, {Name}JsonData } from "../core/types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, execute{Name}, pluginCore } from "../core/plugin";
export { SAMPLES } from "../core/samples";
export { View, Preview };

export default { plugin };
```

### src/react/View.tsx

```tsx
import { useState, useEffect } from "react";
import type { ViewComponentProps } from "gui-chat-protocol";
import type { {Name}Data } from "../core/types";
import { TOOL_NAME } from "../core/definition";

type ViewProps = ViewComponentProps<never, {Name}Data>;

export function View({ selectedResult, sendTextMessage, onUpdateResult }: ViewProps) {
  const [data, setData] = useState<{Name}Data | null>(null);

  useEffect(() => {
    if (selectedResult?.toolName === TOOL_NAME && selectedResult.data) {
      setData(selectedResult.data);
    }
  }, [selectedResult]);

  if (!data) return null;

  return (
    <div className="w-full p-4">
      {/* Your UI here */}
    </div>
  );
}

export default View;
```

### src/react/Preview.tsx

```tsx
import type { PreviewComponentProps } from "gui-chat-protocol";
import type { {Name}Data } from "../core/types";

type PreviewProps = PreviewComponentProps<{Name}Data>;

export function Preview({ result }: PreviewProps) {
  return (
    <div className="p-4 bg-blue-50 rounded text-center">
      <div className="text-xl mb-1">{emoji}</div>
      <div className="text-sm text-blue-700 truncate">
        {result.title || "Untitled"}
      </div>
    </div>
  );
}

export default Preview;
```

### src/react/index.ts

```typescript
import "../style.css";
import type { ToolPluginReact } from "gui-chat-protocol/react";
import type { {Name}Data, {Name}Args, {Name}JsonData } from "../core/types";
import { pluginCore } from "../core/plugin";
import { View } from "./View";
import { Preview } from "./Preview";

export const plugin: ToolPluginReact<never, {Name}Data, {Name}Args> = {
  ...pluginCore,
  ViewComponent: View,
  PreviewComponent: Preview,
};

export type { {Name}Data, {Name}Args, {Name}JsonData } from "../core/types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, execute{Name}, pluginCore } from "../core/plugin";
export { SAMPLES } from "../core/samples";
export { View, Preview };

export default { plugin };
```

---

## Common Mistakes to Avoid

### 1. Missing toolName in return

```typescript
// WRONG
return {
  message: "Success",
  data: myData,
};

// CORRECT
return {
  toolName: TOOL_NAME,  // Required!
  message: "Success",
  data: myData,
};
```

### 2. Wrong TOOL_NAME check in View

```typescript
// WRONG - hardcoded string
if (result?.toolName === "myTool") { ... }

// CORRECT - use imported constant
import { TOOL_NAME } from "../core/definition";
if (result?.toolName === TOOL_NAME) { ... }
```

### 3. Missing style.css import

```typescript
// WRONG
import type { ToolPlugin } from "gui-chat-protocol/vue";

// CORRECT
import "../style.css";  // Must be first!
import type { ToolPlugin } from "gui-chat-protocol/vue";
```

### 4. Type mismatch

```typescript
// types.ts
export interface MyData {
  name: string;  // string
}

// View.vue - WRONG
const name = ref<number>(0);  // number!

// View.vue - CORRECT
const name = ref<string>("");  // matches type
```

---

## Verification Commands

After implementation, run these commands:

```bash
npm run typecheck   # Check TypeScript errors
npm run lint        # Check code style
npm run build       # Build library
npm run dev         # Test Vue demo
npm run dev:react   # Test React demo
```

---

## Example Prompt for AI

```
Read docs/ai-development-guide.md in GUIChatPluginTemplate and create a new plugin:

Plugin: guichat-plugin-countdown
Function: Display a countdown timer with customizable duration and message

Tool Definition:
- name: countdownTimer
- description: Start a countdown timer with a message
- parameters:
  - seconds (number): Duration in seconds [required]
  - message (string): Message to display [optional]

Implementation:
- Data type: { seconds: number, message: string, startTime: number }
- JSON data: never
- View: Show countdown with progress bar, message, and start/stop buttons
- Preview: Show remaining time or "Timer" with clock emoji
- Samples: "30 second timer", "5 minute break"

Follow the templates exactly. Ensure toolName is in all returns.
```

---

## Reference

- [Full Plugin Development Guide](./plugin-development-guide.md)
- [npm Publishing Guide](./npm-publishing-guide.md)
- [gui-chat-protocol types](https://www.npmjs.com/package/gui-chat-protocol)
