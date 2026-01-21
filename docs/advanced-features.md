# Advanced Features Guide

This guide explains how to add advanced features to your plugin.

## Table of Contents

1. [Adding Interactivity (sendTextMessage)](#1-adding-interactivity-sendtextmessage)
2. [State Persistence (viewState)](#2-state-persistence-viewstate)
3. [Styling with Tailwind CSS](#3-styling-with-tailwind-css)

---

## 1. Adding Interactivity (sendTextMessage)

### What is sendTextMessage?

`sendTextMessage` is a function that sends messages from your View component to the chat. It allows user interactions (button clicks, selections, etc.) to be reflected in the chat.

```
User interacts with View
    ↓
sendTextMessage("message")
    ↓
Sent to chat
    ↓
LLM generates response
```

### Function Signature

```typescript
sendTextMessage: (text?: string, options?: SendTextMessageOptions) => void;

interface SendTextMessageOptions {
  data?: unknown;  // Optional data for debugging/testing
}
```

### Usage in Vue

**1. Receive as prop:**

```vue
<script setup lang="ts">
const props = defineProps<{
  selectedResult: ToolResult;
  sendTextMessage: (text?: string, options?: SendTextMessageOptions) => void;
}>();
</script>
```

**2. Call the function:**

```vue
<script setup lang="ts">
function handleSubmit() {
  props.sendTextMessage("User's message");
}
</script>

<template>
  <button @click="handleSubmit">Submit</button>
</template>
```

### Usage in React

```tsx
import type { ViewComponentProps } from "gui-chat-protocol";
import type { MyData } from "../core/types";

export function View({ selectedResult, sendTextMessage }: ViewComponentProps<never, MyData>) {
  const handleSubmit = () => {
    sendTextMessage("User's message");
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Practical Example 1: Submitting Quiz Answers

```vue
<script setup lang="ts">
import { ref, computed } from "vue";

const userAnswers = ref<(number | null)[]>([]);

const allQuestionsAnswered = computed(() => {
  return userAnswers.value.every(answer => answer !== null);
});

function handleSubmit() {
  if (!allQuestionsAnswered.value) return;

  // Format answers into a message
  const answerText = userAnswers.value
    .map((answer, index) => {
      const questionNum = index + 1;
      const choiceLetter = String.fromCharCode(65 + answer!); // A, B, C...
      return `Q${questionNum}: ${choiceLetter}`;
    })
    .join("\n");

  const message = `Here are my answers:\n${answerText}`;
  props.sendTextMessage(message);
}
</script>

<template>
  <button
    @click="handleSubmit"
    :disabled="!allQuestionsAnswered"
  >
    Submit Answers
  </button>
</template>
```

### Practical Example 2: Sending Game Moves (Othello)

```vue
<script setup lang="ts">
interface CellData {
  row: number;
  col: number;
  isLegalMove: boolean;
}

function handleCellClick(cell: CellData) {
  if (!cell.isLegalMove) return;

  // Convert column to letter (A, B, C...)
  const columnLetter = String.fromCharCode(65 + cell.col);
  const rowNumber = cell.row + 1;

  // Optionally add debug data
  const clickData = {
    row: cell.row,
    col: cell.col,
    currentState: gameState.value,
  };

  props.sendTextMessage(
    `I want to play at ${columnLetter}${rowNumber} (column=${cell.col}, row=${cell.row})`,
    { data: clickData }  // For debugging
  );
}
</script>
```

### Practical Example 3: Sending Tic-Tac-Toe Moves

```vue
<script setup lang="ts">
function handleCellClick(index: number) {
  const cell = flatBoard.value[index];
  if (!cell.isLegalMove) return;

  const rowNames = ["top", "middle", "bottom"];
  const colNames = ["left", "center", "right"];
  const positionName = `${rowNames[cell.row]}-${colNames[cell.col]}`;

  props.sendTextMessage?.(`I want to play at ${positionName}`);
}
</script>
```

### Best Practices

1. **Use optional chaining** (in case prop is undefined):
   ```typescript
   props.sendTextMessage?.("message");
   ```

2. **Send meaningful messages** (so the LLM can understand):
   ```typescript
   // ✅ Good
   props.sendTextMessage("I want to play at B3");

   // ❌ Bad
   props.sendTextMessage("clicked");
   ```

3. **Pass debug data via options**:
   ```typescript
   props.sendTextMessage("message", { data: debugInfo });
   ```

---

## 2. State Persistence (viewState)

### What is viewState?

`viewState` is a mechanism for saving View component state. When users switch to a different result and come back, the previous state (input values, selections, etc.) can be restored.

```
User selects Result A
    ↓
User interacts with Result A's View (selects checkboxes)
    ↓
State saved to viewState
    ↓
User switches to Result B
    ↓
User switches back to Result A
    ↓
State restored from viewState (checkboxes still selected)
```

### viewState Field in ToolResult

```typescript
interface ToolResult<T = unknown, J = unknown> {
  toolName?: string;
  message: string;
  data?: T;                              // UI data
  jsonData?: J;                          // LLM data
  viewState?: Record<string, unknown>;   // ← For UI state persistence
}
```

### Basic Usage (Vue)

**Step 1: Restore state**

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol";

const props = defineProps<{
  selectedResult: ToolResult;
}>();

const userAnswers = ref<(number | null)[]>([]);

// Restore state when selectedResult changes
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.viewState?.userAnswers) {
      // Restore from viewState
      userAnswers.value = newResult.viewState.userAnswers as (number | null)[];
    } else {
      // Initial state
      userAnswers.value = [];
    }
  },
  { immediate: true }  // Also run on mount
);
</script>
```

**Step 2: Save state**

```vue
<script setup lang="ts">
import type { ToolResult } from "gui-chat-protocol";

const emit = defineEmits<{
  updateResult: [result: ToolResult];
}>();

// Update viewState when state changes
watch(
  userAnswers,
  (newAnswers) => {
    if (props.selectedResult) {
      const updatedResult: ToolResult = {
        ...props.selectedResult,
        viewState: {
          userAnswers: newAnswers,
        },
      };
      emit("updateResult", updatedResult);
    }
  },
  { deep: true }  // Detect deep changes in arrays/objects
);
</script>
```

### Basic Usage (React)

```tsx
import { useState, useEffect, useCallback } from "react";
import type { ViewComponentProps } from "gui-chat-protocol";

export function View({ selectedResult, onUpdateResult }: ViewComponentProps<never, MyData>) {
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

  // Restore state
  useEffect(() => {
    if (selectedResult?.viewState?.userAnswers) {
      setUserAnswers(selectedResult.viewState.userAnswers as (number | null)[]);
    } else {
      setUserAnswers([]);
    }
  }, [selectedResult]);

  // Save state
  const updateAnswers = useCallback(
    (newAnswers: (number | null)[]) => {
      setUserAnswers(newAnswers);
      if (onUpdateResult) {
        onUpdateResult({
          viewState: { userAnswers: newAnswers },
        });
      }
    },
    [onUpdateResult]
  );

  return (/* ... */);
}
```

### Practical Example 1: Quiz Answer State

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { QuizData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult;
}>();

const emit = defineEmits<{
  updateResult: [result: ToolResult];
}>();

const quizData = ref<QuizData | null>(null);
const userAnswers = ref<(number | null)[]>([]);

// Restore
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.jsonData) {
      quizData.value = newResult.jsonData as QuizData;

      if (newResult.viewState?.userAnswers) {
        userAnswers.value = newResult.viewState.userAnswers as (number | null)[];
      } else {
        // Initialize array for new quiz
        userAnswers.value = new Array(quizData.value.questions.length).fill(null);
      }
    }
  },
  { immediate: true }
);

// Save
watch(
  userAnswers,
  (newAnswers) => {
    if (props.selectedResult && newAnswers) {
      emit("updateResult", {
        ...props.selectedResult,
        viewState: {
          userAnswers: newAnswers,
        },
      });
    }
  },
  { deep: true }
);
</script>
```

### Practical Example 2: Canvas Drawing State

```vue
<script setup lang="ts">
interface CanvasDrawingState {
  strokes: unknown[];
  brushSize: number;
  brushColor: string;
}

const brushSize = ref(5);
const brushColor = ref("#000000");
const strokes = ref<unknown[]>([]);

// Restore
function restoreDrawingState() {
  if (props.selectedResult?.viewState?.drawingState) {
    const state = props.selectedResult.viewState.drawingState as CanvasDrawingState;
    brushSize.value = state.brushSize || 5;
    brushColor.value = state.brushColor || "#000000";
    strokes.value = state.strokes || [];
  }
}

// Save
function saveDrawingState() {
  const drawingState: CanvasDrawingState = {
    strokes: strokes.value,
    brushSize: brushSize.value,
    brushColor: brushColor.value,
  };

  emit("updateResult", {
    ...props.selectedResult,
    viewState: { drawingState },
  });
}

// Save when drawing changes
watch([brushSize, brushColor, strokes], saveDrawingState, { deep: true });
</script>
```

### Practical Example 3: 3D Camera Position

```vue
<script setup lang="ts">
interface CameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

// Restore
function restoreCameraState() {
  const state = props.selectedResult?.viewState?.cameraState as CameraState | undefined;
  if (state) {
    camera.position.set(state.position.x, state.position.y, state.position.z);
    controls.target.set(state.target.x, state.target.y, state.target.z);
  }
}

// Save (with debounce)
let saveTimeout: number | null = null;

function saveCameraState() {
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = window.setTimeout(() => {
    const cameraState: CameraState = {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
    };

    emit("updateResult", {
      ...props.selectedResult,
      viewState: { cameraState },
    });
  }, 500);  // Save after 500ms
}
</script>
```

### Best Practices

1. **Use `{ immediate: true }`** - Restore immediately on mount:
   ```typescript
   watch(() => props.selectedResult, handler, { immediate: true });
   ```

2. **Use `{ deep: true }`** - Detect nested object changes:
   ```typescript
   watch(userAnswers, handler, { deep: true });
   ```

3. **Use debounce** - Avoid frequent updates:
   ```typescript
   let timeout: number | null = null;
   function debouncedSave() {
     if (timeout) clearTimeout(timeout);
     timeout = setTimeout(save, 500);
   }
   ```

4. **Preserve existing viewState**:
   ```typescript
   emit("updateResult", {
     ...props.selectedResult,
     viewState: {
       ...props.selectedResult.viewState,  // Keep existing state
       newField: newValue,                  // Add new field
     },
   });
   ```

---

## 3. Styling with Tailwind CSS

### Configuration

Tailwind CSS 4 is pre-configured in GUIChatPluginTemplate.

**vite.config.ts:**
```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
});
```

**src/style.css:**
```css
@import "tailwindcss";
```

### Basic Styling

**Vue:**
```vue
<template>
  <div class="w-full h-full p-4 bg-white">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Title</h1>
    <p class="text-gray-600">Description</p>
  </div>
</template>
```

**React:**
```tsx
return (
  <div className="w-full h-full p-4 bg-white">
    <h1 className="text-2xl font-bold text-gray-800 mb-4">Title</h1>
    <p className="text-gray-600">Description</p>
  </div>
);
```

### Common Utility Classes

#### Sizing

| Class | Description |
|-------|-------------|
| `w-full` | width: 100% |
| `h-full` | height: 100% |
| `size-full` | width & height 100% (Tailwind 4) |
| `size-4` | width & height 1rem |
| `min-h-[300px]` | min-height: 300px |
| `max-w-3xl` | max-width: 48rem |

#### Spacing

| Class | Description |
|-------|-------------|
| `p-4` | padding: 1rem |
| `px-4` | padding-left/right: 1rem |
| `py-2` | padding-top/bottom: 0.5rem |
| `m-4` | margin: 1rem |
| `mb-4` | margin-bottom: 1rem |
| `gap-4` | flex/grid gap: 1rem |

#### Flexbox

| Class | Description |
|-------|-------------|
| `flex` | display: flex |
| `flex-col` | flex-direction: column |
| `items-center` | align-items: center |
| `justify-center` | justify-content: center |
| `justify-between` | justify-content: space-between |
| `flex-1` | flex: 1 (fill remaining space) |
| `flex-shrink-0` | flex-shrink: 0 |

#### Grid

| Class | Description |
|-------|-------------|
| `grid` | display: grid |
| `grid-cols-3` | 3-column grid |
| `grid-cols-8` | 8-column grid |
| `gap-2` | grid gap: 0.5rem |

#### Text

| Class | Description |
|-------|-------------|
| `text-lg` | font-size: 1.125rem |
| `text-2xl` | font-size: 1.5rem |
| `font-bold` | font-weight: 700 |
| `text-center` | text-align: center |
| `text-gray-600` | color: gray |
| `truncate` | ellipsis (...) |

#### Background & Border

| Class | Description |
|-------|-------------|
| `bg-white` | background: white |
| `bg-gray-100` | background: light gray |
| `bg-blue-600` | background: blue |
| `rounded` | border-radius: 0.25rem |
| `rounded-lg` | border-radius: 0.5rem |
| `border` | border: 1px solid |
| `border-2` | border: 2px solid |
| `border-gray-300` | border-color: gray |

#### Interaction

| Class | Description |
|-------|-------------|
| `hover:bg-blue-700` | hover background color |
| `cursor-pointer` | cursor: pointer |
| `transition-colors` | color transition |
| `transition-all` | all transitions |
| `duration-200` | transition duration: 200ms |

### Custom Colors (Arbitrary Values)

For colors not in Tailwind's defaults:

```vue
<template>
  <div class="bg-[#1a1a2e] text-[#f0f0f0] border-[#3d3d5c]">
    Custom colors
  </div>
</template>
```

### Conditional Styling (Vue)

**`:class` binding:**

```vue
<template>
  <button
    :class="[
      'py-2 px-4 rounded font-semibold transition-colors',
      isEnabled
        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
    ]"
    :disabled="!isEnabled"
  >
    Button
  </button>
</template>
```

**Object syntax:**

```vue
<template>
  <div
    :class="{
      'bg-green-600': isSelected,
      'bg-gray-200': !isSelected,
      'hover:bg-green-500': isClickable,
    }"
  >
    Cell
  </div>
</template>
```

**Function-generated:**

```vue
<script setup lang="ts">
function getCellClass(cell: Cell) {
  const base = "w-12 h-12 flex items-center justify-center border";
  const state = cell.isSelected ? "bg-blue-500" : "bg-white";
  const hover = cell.isClickable ? "hover:bg-blue-200 cursor-pointer" : "";
  return `${base} ${state} ${hover}`;
}
</script>

<template>
  <div
    v-for="cell in cells"
    :key="cell.id"
    :class="getCellClass(cell)"
  >
    {{ cell.value }}
  </div>
</template>
```

### Conditional Styling (React)

```tsx
<button
  className={`py-2 px-4 rounded font-semibold transition-colors ${
    isEnabled
      ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
      : "bg-gray-400 text-gray-200 cursor-not-allowed"
  }`}
  disabled={!isEnabled}
>
  Button
</button>
```

### Dark Theme Example (Quiz)

```vue
<template>
  <div class="size-full overflow-y-auto p-8 bg-[#1a1a2e]">
    <div class="max-w-3xl w-full mx-auto">
      <!-- Title -->
      <h2 class="text-[#f0f0f0] text-3xl font-bold mb-8 text-center">
        {{ title }}
      </h2>

      <!-- Question Cards -->
      <div class="flex flex-col gap-6">
        <div
          v-for="(question, index) in questions"
          :key="index"
          class="bg-[#2d2d44] rounded-lg p-6 border-2 border-[#3d3d5c]"
        >
          <!-- Question Text -->
          <div class="text-white text-lg font-semibold mb-4">
            <span class="text-blue-400 mr-2">{{ index + 1 }}.</span>
            {{ question.text }}
          </div>

          <!-- Choices -->
          <div class="flex flex-col gap-3">
            <label
              v-for="(choice, cIndex) in question.choices"
              :key="cIndex"
              :class="[
                'flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 border-2',
                selectedAnswer === cIndex
                  ? 'bg-blue-900 border-blue-500'
                  : 'bg-[#3d3d5c] border-transparent hover:border-blue-400'
              ]"
            >
              <input
                type="radio"
                :value="cIndex"
                v-model="selectedAnswer"
                class="mr-3 size-4"
              />
              <span class="text-white">{{ choice }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="mt-8 flex justify-center">
        <button
          @click="handleSubmit"
          :class="[
            'py-3 px-8 rounded-lg font-semibold text-lg transition-colors',
            canSubmit
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
          ]"
          :disabled="!canSubmit"
        >
          Submit Answers
        </button>
      </div>
    </div>
  </div>
</template>
```

### Game Board (Grid) Example (Othello)

```vue
<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-4">
    <!-- Turn Display -->
    <div class="text-white text-lg font-bold mb-4">
      Current Turn: {{ currentPlayer }}
    </div>

    <!-- Game Board -->
    <div class="grid grid-cols-8 gap-0.5 p-4 bg-green-800 rounded-lg border-2 border-green-900">
      <div
        v-for="(cell, index) in board"
        :key="index"
        :class="[
          'w-12 h-12 flex items-center justify-center bg-green-700 border border-green-900',
          cell.isLegalMove && 'cursor-pointer hover:bg-green-600'
        ]"
        @click="handleCellClick(cell)"
      >
        <!-- Piece -->
        <div
          v-if="cell.piece"
          :class="[
            'w-10 h-10 rounded-full border-2 border-gray-600',
            cell.piece === 'black' ? 'bg-black' : 'bg-white'
          ]"
        />

        <!-- Legal Move Indicator -->
        <div
          v-else-if="cell.isLegalMove"
          class="w-3 h-3 rounded-full bg-green-400 opacity-50"
        />
      </div>
    </div>
  </div>
</template>
```

### Preview Component Example

```vue
<template>
  <div class="p-3 bg-blue-50 rounded text-center">
    <div class="text-blue-600 font-medium">{{ title }}</div>
    <div class="text-xs text-gray-600 mt-1 truncate">
      {{ subtitle }}
    </div>
  </div>
</template>
```

### Best Practices

1. **Prefer utility classes** - Use Tailwind classes over scoped CSS

2. **Consistent spacing** - Use `gap-4`, `p-4`, `mb-4` consistently

3. **Responsive layout** - Use `max-w-3xl mx-auto` for centered, max-width layout

4. **Add transitions** - Use `transition-colors duration-200` for interactive elements

5. **Handle overflow** - Use `overflow-y-auto` for scrollable containers

6. **Utilize flex** - Use `flex-1` and `min-h-0` for flexible layouts

---

## Reference Links

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [gui-chat-protocol](https://github.com/receptron/gui-chat-protocol)
