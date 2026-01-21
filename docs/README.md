# GUIChat Plugin Template Documentation

This template provides everything you need to create GUIChat/MulmoChat plugins with both Vue and React support.

> **Note**: This template includes a **Quiz plugin as a working sample**. The Quiz plugin demonstrates how to create interactive plugins with user input. Replace it with your own plugin implementation.

## Who is this for?

- **Beginners**: New to plugin development? Start with [Getting Started](./getting-started.md)
- **AI Assistants**: Developing with Claude/GPT? Use [AI Development Guide](./ai-development-guide.md)
- **Experienced Developers**: Jump to [Plugin Development Guide](./plugin-development-guide.md)

## Quick Navigation

| Document | Description | Target |
|----------|-------------|--------|
| [Getting Started](./getting-started.md) | Step-by-step tutorial to create your first plugin | Beginners |
| [Plugin Development Guide](./plugin-development-guide.md) | Comprehensive development reference | All developers |
| [AI Development Guide](./ai-development-guide.md) | Optimized instructions for AI coding assistants | AI + Developers |
| [npm Publishing Guide](./npm-publishing-guide.md) | How to publish and use in MulmoChat | All developers |

## Quick Start (5 minutes)

### 1. Clone and Setup

```bash
# Clone this template
git clone https://github.com/receptron/GUIChatPluginTemplate.git GUIChatPluginMyPlugin
cd GUIChatPluginMyPlugin

# Install dependencies
npm install

# Run the demo
npm run dev        # Vue demo
npm run dev:react  # React demo
```

### 2. Try the Demo

Open http://localhost:5173 in your browser. You'll see:
- A chat interface on the left
- Plugin View/Preview on the right
- Sample buttons to test the plugin

### 3. Customize

Edit these files to create your plugin:
- `src/core/definition.ts` - Tool name and schema
- `src/core/plugin.ts` - Execute function
- `src/vue/View.vue` or `src/react/View.tsx` - UI component

## Template Structure

```
GUIChatPluginTemplate/
├── src/
│   ├── core/           # Framework-agnostic logic
│   │   ├── definition.ts  # Tool schema (name, parameters)
│   │   ├── plugin.ts      # Execute function
│   │   ├── types.ts       # TypeScript types
│   │   └── samples.ts     # Test samples
│   ├── vue/            # Vue components
│   │   ├── View.vue       # Main display
│   │   └── Preview.vue    # Thumbnail
│   └── react/          # React components
│       ├── View.tsx       # Main display
│       └── Preview.tsx    # Thumbnail
├── demo/
│   ├── vue/            # Vue demo with chat
│   ├── react/          # React demo with chat
│   └── shared/         # Shared chat utilities
└── docs/               # This documentation
```

## Key Concepts

### What is a Plugin?

A plugin is a tool that LLM can call to perform actions and display results:

```
User: "Show me a quiz about JavaScript"
    ↓
LLM decides to use "quiz" tool
    ↓
Plugin's execute() function runs
    ↓
Result displayed in View component
```

### Core Components

1. **Tool Definition** (`definition.ts`)
   - Tells LLM what the tool does
   - Defines parameters the tool accepts

2. **Execute Function** (`plugin.ts`)
   - Runs when LLM calls the tool
   - Returns data for display

3. **View Component** (`View.vue` / `View.tsx`)
   - Displays the result
   - Handles user interaction

4. **Preview Component** (`Preview.vue` / `Preview.tsx`)
   - Thumbnail shown in sidebar

## Demo Chat Feature

This template includes a built-in chat demo for testing:

- **Mock Mode**: Test without API key (pattern-based responses)
- **Real API Mode**: Connect to OpenAI for actual LLM interaction

To use Real API Mode:
```bash
# Create .env file
echo "VITE_OPENAI_API_KEY=your-api-key-here" > .env
```

## Next Steps

1. **Beginners**: Read [Getting Started](./getting-started.md) for a hands-on tutorial
2. **Create Your Plugin**: Follow [Plugin Development Guide](./plugin-development-guide.md)
3. **Publish**: Use [npm Publishing Guide](./npm-publishing-guide.md) to share your plugin

## Reference Plugins

Learn from existing plugins:

| Plugin | Features | Good For Learning |
|--------|----------|-------------------|
| [GUIChatPluginQuiz](https://github.com/receptron/GUIChatPluginQuiz) | Simple data display | Beginners |
| [GUIChatPluginOthello](https://github.com/receptron/GUIChatPluginOthello) | Interactive game | User interaction |
| [GUIChatPluginHtml](https://github.com/receptron/GUIChatPluginHtml) | HTML rendering | Display patterns |
| [GUIChatPluginMap](https://github.com/receptron/GUIChatPluginMap) | Google Maps | External APIs |

## Resources

- [gui-chat-protocol npm](https://www.npmjs.com/package/gui-chat-protocol) - Shared type definitions
- [MulmoChat](https://github.com/receptron/MulmoChat) - Host application
- [Vue 3 Docs](https://vuejs.org/)
- [React Docs](https://react.dev/)
