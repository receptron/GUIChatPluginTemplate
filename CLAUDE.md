# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

GUIChatPluginTemplate is a template for creating GUI plugins for MulmoChat. It supports both Vue and React.

**Current Sample**: Quiz plugin (displays multiple choice questions)

## Key Commands

```bash
yarn install      # Install dependencies
yarn dev          # Start Vue demo server (http://localhost:5173)
yarn dev:react    # Start React demo server
yarn build        # Build (outputs to dist/)
yarn typecheck    # Type check
yarn lint         # Lint check
```

---

## Plugin Creation Flow

When a user requests "create a XX plugin", follow these steps.

### Overall Flow

```
1. Confirm user requirements
2. Edit files in src/core/
3. Edit View and Preview in src/vue/
4. Add Mock to demo/shared/chat-utils.ts
5. Test with yarn dev
```

### Files to Edit (Order Matters)

**IMPORTANT**: Create both Vue and React components simultaneously.

```
src/
├── core/
│   ├── definition.ts  ← ① Tool definition (what LLM sees)
│   ├── types.ts       ← ② TypeScript type definitions
│   ├── plugin.ts      ← ③ execute function (main logic)
│   ├── samples.ts     ← ④ Quick Samples button data
│   └── index.ts       ← Usually no edits needed
├── vue/
│   ├── View.vue       ← ⑤ Main display component (Vue)
│   ├── Preview.vue    ← ⑥ Sidebar thumbnail (Vue)
│   └── index.ts       ← Usually no edits needed
└── react/
    ├── View.tsx       ← ⑦ Main display component (React)
    ├── Preview.tsx    ← ⑧ Sidebar thumbnail (React)
    └── index.ts       ← Usually no edits needed
```

---

## How to Write Each File

### ① definition.ts - Tool Definition

Defines information for the LLM to decide when to use this tool.

```typescript
import type { ToolDefinition } from "gui-chat-protocol";

// Tool name (namespace:toolname format recommended)
// Examples: "receptron:quiz", "myorg:countdown", "username:greeting"
export const TOOL_NAME = "yournamespace:yourToolName";

// Tool definition (JSON Schema format)
export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description: "Description of this tool (helps LLM decide when to use it)",
  parameters: {
    type: "object",
    properties: {
      // Define parameters passed from LLM
      title: {
        type: "string",
        description: "Parameter description",
      },
      items: {
        type: "array",
        items: { type: "string" },
        description: "Array description",
      },
    },
    required: ["title"],  // Required parameters
  },
};
```

**Key Points**:
- `TOOL_NAME` should use `namespace:toolname` format (e.g., `receptron:quiz`)
- Use GitHub account name or organization name as namespace
- Write `description` that LLM can understand
- `parameters` follows JSON Schema format

### ② types.ts - Type Definitions

```typescript
// Data type (used in View/Preview)
export interface YourData {
  title: string;
  items: string[];
}

// Args type (corresponds to parameters in definition.ts)
export interface YourArgs {
  title: string;
  items?: string[];  // Add ? for non-required params
}
```

**Key Points**:
- `YourArgs` should match `parameters` in definition.ts
- `YourData` is the data structure for View display

### ③ plugin.ts - execute Function

```typescript
import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";
import type { YourData, YourArgs } from "./types";
import { TOOL_NAME, TOOL_DEFINITION } from "./definition";
import { SAMPLES } from "./samples";

// execute function - Called when LLM invokes the tool
export const executeYourTool = async (
  _context: ToolContext,
  args: YourArgs,
): Promise<ToolResult<YourData, never>> => {
  const { title, items } = args;

  // Create data
  const data: YourData = {
    title,
    items: items || [],
  };

  return {
    toolName: TOOL_NAME,  // Required! Must match TOOL_NAME
    message: `Created ${title}`,  // Report to LLM
    data,  // Data for View (invisible to LLM)
    // jsonData: {...},  // Use when you need to show data to LLM
    instructions: "Tell the user to check the result",  // Instructions to LLM
  };
};

// Plugin core
export const pluginCore: ToolPluginCore<YourData, never, YourArgs> = {
  toolDefinition: TOOL_DEFINITION,
  execute: executeYourTool,
  generatingMessage: "Creating...",  // Message shown during execution
  isEnabled: () => true,
  samples: SAMPLES,
};
```

**Key Points**:
- `toolName` must always use `TOOL_NAME` (View won't display if they don't match)
- `data` is for View, `jsonData` is for LLM
- `instructions` can give LLM instructions for the next response

### ④ samples.ts - Test Data

```typescript
import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "Sample 1",  // Display name for Quick Samples button
    args: {
      // Data corresponding to YourArgs
      title: "Test Title",
      items: ["Item 1", "Item 2"],
    },
  },
  {
    name: "Sample 2",
    args: {
      title: "Another Test",
    },
  },
];
```

### ⑤ View.vue - Main Display (Vue)

```vue
<template>
  <div class="size-full p-4 bg-white">
    <div v-if="data" class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">{{ data.title }}</h2>
      <ul class="space-y-2">
        <li v-for="(item, index) in data.items" :key="index" class="p-2 bg-gray-100 rounded">
          {{ item }}
        </li>
      </ul>
      <!-- For user actions -->
      <button @click="handleAction" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Action
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { YourData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult;
  sendTextMessage: (text?: string) => void;  // Send message to chat
}>();

const emit = defineEmits<{
  updateResult: [result: ToolResult];  // Update viewState
}>();

const data = ref<YourData | null>(null);

// Watch result and update data
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.data) {
      data.value = newResult.data as YourData;
    }
  },
  { immediate: true }
);

// User action
function handleAction() {
  props.sendTextMessage("Action executed");
}
</script>
```

### ⑥ Preview.vue - Thumbnail (Vue)

```vue
<template>
  <div class="p-3 bg-blue-50 rounded text-center">
    <div class="text-blue-600 font-medium">{{ title }}</div>
    <div class="text-xs text-gray-600 mt-1">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { YourData } from "../core/types";

const props = defineProps<{
  result: ToolResult;
}>();

const data = computed(() => props.result.data as YourData | null);
const title = computed(() => data.value?.title || "Title");
const subtitle = computed(() => `${data.value?.items?.length || 0} items`);
</script>
```

### ⑦ View.tsx - Main Display (React)

```tsx
import { useState, useEffect, useCallback } from "react";
import type { ViewComponentProps } from "gui-chat-protocol";
import type { YourData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

type ViewProps = ViewComponentProps<YourData, never>;

export function View({ selectedResult, sendTextMessage, onUpdateResult }: ViewProps) {
  const [data, setData] = useState<YourData | null>(null);

  // Watch result and update data
  useEffect(() => {
    if (selectedResult?.toolName === TOOL_NAME && selectedResult.data) {
      setData(selectedResult.data as YourData);
    }
  }, [selectedResult]);

  // User action
  const handleAction = () => {
    sendTextMessage("Action executed");
  };

  if (!data) {
    return null;
  }

  return (
    <div className="size-full p-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{data.title}</h2>
        <ul className="space-y-2">
          {data.items.map((item, index) => (
            <li key={index} className="p-2 bg-gray-100 rounded">
              {item}
            </li>
          ))}
        </ul>
        {/* For user actions */}
        <button
          onClick={handleAction}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Action
        </button>
      </div>
    </div>
  );
}

export default View;
```

### ⑧ Preview.tsx - Thumbnail (React)

```tsx
import type { PreviewComponentProps } from "gui-chat-protocol";
import type { YourData } from "../core/types";

type PreviewProps = PreviewComponentProps<YourData, never>;

export function Preview({ result }: PreviewProps) {
  const data = result.data as YourData | null;

  if (!data) {
    return null;
  }

  const title = data.title || "Title";
  const subtitle = `${data.items?.length || 0} items`;

  return (
    <div className="p-3 bg-blue-50 rounded text-center">
      <div className="text-blue-600 font-medium">{title}</div>
      <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
    </div>
  );
}

export default Preview;
```

**Vue vs React Differences**:

| Item | Vue | React |
|------|-----|-------|
| Data watching | `watch(() => props.selectedResult, ...)` | `useEffect(() => {...}, [selectedResult])` |
| State | `ref<T>(null)` | `useState<T>(null)` |
| Props type | `defineProps<{...}>()` | `ViewComponentProps<T, J>` |
| viewState update | `emit("updateResult", {...})` | `onUpdateResult({...})` |
| Class | `class="..."` | `className="..."` |
| Conditional render | `v-if="data"` | `if (!data) return null;` |
| Loop | `v-for="(item, i) in items"` | `items.map((item, i) => ...)` |

---

## Mock Mode Setup

### Edit demo/shared/chat-utils.ts

```typescript
export const DEFAULT_MOCK_RESPONSES: Record<string, MockResponse> = {
  // Existing quiz
  quiz: { /* ... */ },

  // Add Mock for new plugin
  yourTool: {
    toolCall: {
      name: "yourToolName",  // Match TOOL_NAME
      args: {
        // Corresponds to parameters in definition.ts
        title: "Test Title",
        items: ["Item 1", "Item 2"],
      },
    },
  },

  // ...
};

export const findMockResponse = (
  userMessage: string,
  mockResponses: Record<string, MockResponse> = DEFAULT_MOCK_RESPONSES
): MockResponse => {
  const lowerMessage = userMessage.toLowerCase();

  // Existing
  if (lowerMessage.includes("quiz") || lowerMessage.includes("question")) {
    return mockResponses.quiz || DEFAULT_MOCK_RESPONSES.quiz;
  }

  // Add keywords for new plugin
  if (lowerMessage.includes("yourkeyword")) {
    return mockResponses.yourTool || DEFAULT_MOCK_RESPONSES.yourTool;
  }

  // ...
};
```

---

## Type Parameter Explanation

```typescript
ToolResult<T, J>
ToolPluginCore<T, J, A>
```

| Parameter | Description | Usage |
|-----------|-------------|-------|
| T | data type | For View/Preview (invisible to LLM) |
| J | jsonData type | Data to show to LLM (`never` if not needed) |
| A | args type | Arguments passed from LLM |

**Usage Guidelines**:
- `data`: Large data, UI-only data → T
- `jsonData`: Data needed for LLM's next response → J
- Using both: `ToolResult<ViewData, LLMData>`

---

## Common Patterns

### Pattern 1: Simple Display Only

```typescript
// plugin.ts
return {
  toolName: TOOL_NAME,
  message: "Complete",
  data: { /* For View (invisible to LLM) */ },
};
```

### Pattern 2: Return Data to LLM (jsonData)

Used when you want to show current state to LLM for next action decision.

```typescript
// plugin.ts
return {
  toolName: TOOL_NAME,
  message: "Quiz displayed",
  jsonData: {  // ← LLM sees this to determine next response
    questions: [...],
    correctAnswers: [0, 2, 1],  // Correct answer data
  },
  instructions: "When the user answers, check the correct answers",
};
```

### Pattern 3: User Action → LLM Processing → Show Result (Quiz Answer Verification)

**Flow:**
```
User selects answer
    ↓
View.vue: sendTextMessage("Q1: A, Q2: C, Q3: B")
    ↓
LLM: Compares with correct answers in jsonData and grades
    ↓
LLM: "You got 2 correct! Q2 was wrong"
```

**View.vue:**
```vue
<script setup lang="ts">
function handleSubmit() {
  // Send user answers as text to LLM
  const answerText = userAnswers.value
    .map((answer, index) => {
      const letter = String.fromCharCode(65 + answer); // A, B, C...
      return `Q${index + 1}: ${letter}`;
    })
    .join(", ");

  props.sendTextMessage(`Answers: ${answerText}`);
}
</script>
```

**plugin.ts:**
```typescript
return {
  toolName: TOOL_NAME,
  message: `Quiz displayed (${questions.length} questions)`,
  jsonData: {
    questions,
    correctAnswers: questions.map(q => q.correctAnswer),
  },
  // Instructions to LLM: prompt to verify user answers
  instructions: "When the user submits answers, compare with correctAnswers in jsonData and grade them.",
};
```

### Pattern 4: Game (User vs LLM) - Othello Example

**Flow:**
```
1. User: "Let's play Othello"
    ↓
2. LLM: execute({ action: "new_game" })
    ↓
3. plugin.ts: Creates initial board, returns via jsonData
    ↓
4. View: Displays board, user clicks
    ↓
5. View: sendTextMessage("I place at A3")
    ↓
6. LLM: execute({ action: "move", row: 2, col: 0, board: [...] })
    ↓
7. plugin.ts: Processes user's move, now LLM's turn
    ↓
8. instructions: "It's your turn. Choose your move."
    ↓
9. LLM: execute({ action: "move", row: 4, col: 5, ... })
    ↓
(Returns to 4 and repeats)
```

**definition.ts:**
```typescript
export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description: "Play Othello",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["new_game", "move", "pass"],
        description: "Action: new game, make move, pass",
      },
      row: {
        type: "number",
        description: "Row (0-7)",
      },
      col: {
        type: "number",
        description: "Column (0-7)",
      },
      board: {
        type: "array",
        description: "Current board (8x8). Pass as-is without changes",
        items: { type: "array", items: { type: "string", enum: [".", "B", "W"] } },
      },
      currentSide: {
        type: "string",
        enum: ["B", "W"],
        description: "Current player",
      },
    },
    required: ["action"],
  },
};
```

**plugin.ts:**
```typescript
export const executeOthello = async (
  _context: ToolContext,
  args: OthelloArgs,
): Promise<ToolResult<never, OthelloState>> => {
  let state: OthelloState;

  if (args.action === "new_game") {
    state = createNewGame();
  } else if (args.action === "move") {
    state = makeMove(args.board, args.row, args.col, args.currentSide);
  }

  // Determine if it's LLM's turn
  const isComputerTurn = state.playerNames[state.currentSide] === "computer";

  // Instructions for LLM's next action
  const instructions = state.isTerminal
    ? "Game over. Tell the user the result."
    : isComputerTurn
      ? "It's your turn. Choose from legalMoves in jsonData."
      : "It's the user's turn. Wait for their move.";

  return {
    toolName: TOOL_NAME,
    message: `Placed at (${args.row}, ${args.col})`,
    jsonData: state,  // ← LLM can see board and legal moves
    instructions,
    instructionsRequired: isComputerTurn,  // Send instructions when it's LLM's turn
    updating: args.action !== "new_game",  // Update existing result
  };
};
```

**View.vue:**
```vue
<script setup lang="ts">
const isComputerTurn = computed(() => {
  return gameState.value?.playerNames[gameState.value.currentSide] === "computer";
});

function handleCellClick(row: number, col: number) {
  // Ignore if it's LLM's turn
  if (isComputerTurn.value) return;

  const columnLetter = String.fromCharCode(65 + col); // A-H
  const rowNumber = row + 1; // 1-8

  props.sendTextMessage(`I place at ${columnLetter}${rowNumber} (row=${row}, col=${col})`);
}
</script>
```

### Pattern 5: State Persistence (viewState)

```vue
// View.vue
watch(
  selectedAnswer,
  (newAnswer) => {
    emit("updateResult", {
      ...props.selectedResult,
      viewState: { selectedAnswer: newAnswer },
    });
  }
);

// Restore
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.viewState?.selectedAnswer) {
      selectedAnswer.value = newResult.viewState.selectedAnswer;
    }
  },
  { immediate: true }
);
```

---

## Important ToolResult Fields

```typescript
interface ToolResult<T, J> {
  toolName: string;       // Required: Must match TOOL_NAME
  message: string;        // Concise report to LLM

  // Data
  data?: T;               // View-only (invisible to LLM, large data OK)
  jsonData?: J;           // Data to show to LLM (structured data)

  // Instructions to LLM
  instructions?: string;  // Instructions for next action
  instructionsRequired?: boolean;  // If true, send regardless of user settings

  // Result update
  updating?: boolean;     // If true, update existing result (don't add new)

  // UI
  title?: string;         // Sidebar title
}
```

**Usage Guidelines:**

| Field | Usage | Example |
|-------|-------|---------|
| `data` | Large data for View only | Image data, detailed UI info |
| `jsonData` | Data you want LLM to see | Game state, correct answers, options |
| `instructions` | Instructions for LLM's next action | "Verify the answer" "Choose next move" |
| `instructionsRequired` | Force send instructions | When it's LLM's turn in a game |
| `updating` | Update existing result | When making a move in a game |

---

## Checklist

After creating a plugin, verify the following:

**Core (Required)**:
- [ ] `TOOL_NAME` is in `namespace:toolname` format (e.g., `receptron:quiz`)
- [ ] `parameters` in definition.ts matches `Args` in types.ts
- [ ] `return` in plugin.ts has `toolName: TOOL_NAME`
- [ ] `args` in samples.ts matches `Args` type

**Vue**:
- [ ] View.vue filters with `toolName === TOOL_NAME`
- [ ] Preview.vue displays data correctly

**React**:
- [ ] View.tsx filters with `toolName === TOOL_NAME`
- [ ] Preview.tsx displays data correctly
- [ ] Has `export default View;` and `export default Preview;`

**Testing**:
- [ ] Added Mock to `demo/shared/chat-utils.ts`
- [ ] `yarn typecheck` passes
- [ ] `yarn lint` passes
- [ ] Quick Samples work with `yarn dev` (Vue)
- [ ] Quick Samples work with `yarn dev:react` (React)

---

## Troubleshooting

### View Not Displaying
- Check if `toolName` matches `TOOL_NAME`
- Check if View.vue has `toolName === TOOL_NAME` filtering

### Type Errors
- Check if types in types.ts match parameters in definition.ts
- Run `yarn typecheck` for details

### Mock Mode Not Working
- Check if Mock and keywords are added to `demo/shared/chat-utils.ts`
- Check if keywords match correctly

---

## Reference Documentation

- [Getting Started](./docs/getting-started.md) - Beginner tutorial
- [Advanced Features](./docs/advanced-features.md) - sendTextMessage, viewState, Tailwind CSS
- [npm Publishing Guide](./docs/npm-publishing-guide.md) - Package publishing
