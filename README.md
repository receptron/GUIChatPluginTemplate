# GUIChat Plugin Template

A plugin template for GUIChat/MulmoChat with **integrated chat demo environment**.

This template is designed for junior engineers to learn plugin development with a working chat interface that demonstrates how plugins interact with LLMs.

> **Note**: This template includes a **Quiz plugin as a working sample**. The Quiz plugin demonstrates how to create interactive plugins with user input. Replace it with your own plugin implementation.

## Features

- **Chat-Integrated Demo**: Test your plugin with a real chat interface
- **Mock Mode**: Develop without needing an API key
- **Real API Mode**: Test with OpenAI API for production-like behavior
- **Framework-agnostic Core**: Plugin logic separated from UI framework
- **Vue + React Support**: Both frameworks supported out of the box
- **TypeScript**: Full type safety
- **Tailwind CSS 4**: Modern styling

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

Open http://localhost:5173 to see the demo.

### Demo Features

1. **Chat Panel**: Send messages and see LLM responses
2. **Mock Mode**: Toggle to test without API key (recognizes "quiz" and "hello" keywords)
3. **Real API Mode**: Enter your OpenAI API key for actual LLM integration
4. **View Component**: See how your plugin renders results
5. **Preview Component**: See the sidebar thumbnail
6. **Quick Samples**: Execute plugin samples directly

## Creating Your Own Plugin

### Step 1: Copy this template

```bash
cp -r GUIChatPluginTemplate GUIChatPluginMyPlugin
cd GUIChatPluginMyPlugin
```

### Step 2: Update package.json

Change the package name:
```json
{
  "name": "guichat-plugin-my-plugin",
  "description": "Your plugin description"
}
```

### Step 3: Implement your plugin

Edit the files in `src/core/` (shared by Vue/React):

1. **types.ts** - Define your data types
2. **definition.ts** - Define tool name and JSON schema
3. **samples.ts** - Add test data
4. **plugin.ts** - Implement execute function

#### For Vue

Edit the files in `src/vue/`:

1. **View.vue** - Main UI component
2. **Preview.vue** - Sidebar thumbnail

Start dev server: `yarn dev`

#### For React

Edit the files in `src/react/`:

1. **View.tsx** - Main UI component
2. **Preview.tsx** - Sidebar thumbnail

Start dev server: `yarn dev:react`

### Step 4: Update mock responses (optional)

Edit `demo/shared/chat-utils.ts` to add mock responses for your plugin:

```typescript
export const DEFAULT_MOCK_RESPONSES: Record<string, MockResponse> = {
  // Add your plugin's mock response
  myKeyword: {
    toolCall: {
      name: "myToolName",
      args: { /* your args */ },
    },
  },
  // ...
};
```

## Plugin Structure

✏️ = Edit this file　　🚫 = Don't edit (use as-is)

```
GUIChatPluginTemplate/
│
├── src/                  # 📦 Distributed as npm package
│   │                     #    Used by apps like MulmoChat
│   ├── index.ts          # 🚫 Default export (core)
│   ├── style.css         # 🚫 Tailwind CSS entry
│   ├── core/             # Framework-agnostic (no Vue/React dependencies)
│   │   ├── index.ts      # 🚫 Core exports
│   │   ├── types.ts      # ✏️ Plugin-specific types
│   │   ├── definition.ts # ✏️ Tool definition (schema for LLM)
│   │   ├── samples.ts    # ✏️ Sample data for testing
│   │   └── plugin.ts     # ✏️ Execute function
│   ├── vue/              # Vue-specific implementation
│   │   ├── index.ts      # 🚫 Vue plugin (combines core + components)
│   │   ├── View.vue      # ✏️ Main view component
│   │   └── Preview.vue   # ✏️ Sidebar preview component
│   └── react/            # React-specific implementation
│       ├── index.ts      # 🚫 React plugin (combines core + components)
│       ├── View.tsx      # ✏️ Main view component
│       └── Preview.tsx   # ✏️ Sidebar preview component
│
└── demo/                 # 🔧 For development/testing only (NOT distributed)
    │                     #    Chat demo to test your plugin
    │                     #    🚫 Generally no edits needed
    ├── vue/              # Vue demo
    ├── react/            # React demo
    └── shared/
        └── chat-utils.ts # ✏️ Edit only to add mock responses
```

> **For Beginners**:
> - `src/` = Your plugin code. After npm publish, other apps import and use this
> - `demo/` = Development environment to test your plugin. Not included in npm package
> - Just edit the ✏️ files to create your plugin

## Understanding the Chat Flow

Normally, the chat communicates with the LLM via OpenAI API. Mock Mode is **for development testing only**, allowing you to test plugin behavior without an API key.

```
User Input
    ↓
useChat.sendMessage()
    ↓
┌─────────────────────────────────────┐
│  Mock Mode? (for testing)           │
│  ├─ Yes → Return mock response      │
│  └─ No  → Call OpenAI API ← normal  │
└─────────────────────────────────────┘
    ↓
LLM Response (may include tool_calls)
    ↓
┌─────────────────────────────────────┐
│  Has tool_calls?                    │
│  ├─ Yes → plugin.execute(args)      │
│  │        → Update result           │
│  │        → Show in View component  │
│  │        → Call API again          │
│  │        → Get LLM response        │
│  └─ No  → Show text response        │
└─────────────────────────────────────┘
```

## Key Concepts

### ToolResult

The execute function returns a `ToolResult`:

```typescript
interface ToolResult<T, J> {
  toolName: string;      // Must match TOOL_NAME (required)
  message: string;       // Brief status for LLM
  jsonData?: J;          // Data visible to LLM
  data?: T;              // Data for UI only (not sent to LLM)
  title?: string;        // Result title
  instructions?: string; // Follow-up instructions for LLM
}
```

### View Component Props

```typescript
// Props received by View.vue
{
  selectedResult: ToolResult;              // Current result to display
  sendTextMessage: (text: string) => void; // Send message back to chat
}

// Event emitted
@updateResult="(updated: ToolResult) => void"
```

### Important Pattern: ref + watch

In View.vue, always use `ref + watch` pattern instead of `computed`:

```typescript
// ✅ Correct
const data = ref<MyData | null>(null);
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.jsonData) {
      data.value = newResult.jsonData;
    }
  },
  { immediate: true }
);

// ❌ Wrong - causes reactivity issues
const data = computed(() => props.selectedResult?.jsonData);
```

## Commands

```bash
yarn dev          # Start Vue demo
yarn dev:react    # Start React demo
yarn build        # Build for production
yarn typecheck    # Type check
yarn lint         # Lint code
```

## Integration with MulmoChat

After developing your plugin:

1. Publish to npm or use local path
2. Install in MulmoChat:
   ```bash
   yarn add guichat-plugin-my-plugin
   ```
3. Import in MulmoChat's `src/tools/index.ts`:
   ```typescript
   import MyPlugin from "guichat-plugin-my-plugin/vue";
   ```

## License

MIT
