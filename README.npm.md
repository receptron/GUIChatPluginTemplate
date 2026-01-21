# guichat-plugin-{plugin-name}

[![npm version](https://badge.fury.io/js/guichat-plugin-{plugin-name}.svg)](https://www.npmjs.com/package/guichat-plugin-{plugin-name})

A plugin for [MulmoChat](https://github.com/receptron/MulmoChat) - a multi-modal voice chat application with OpenAI's GPT-4 Realtime API.

## What this plugin does

{plugin-description}

## Installation

```bash
yarn add guichat-plugin-{plugin-name}
```

## Usage

### Vue Implementation (for MulmoChat)

```typescript
// In src/tools/index.ts
import Plugin from "guichat-plugin-{plugin-name}/vue";

const pluginList = [
  // ... other plugins
  Plugin,
];

// In src/main.ts
import "guichat-plugin-{plugin-name}/style.css";
```

### React Implementation

```typescript
import Plugin from "guichat-plugin-{plugin-name}/react";
import "guichat-plugin-{plugin-name}/style.css";

// Named exports
import { plugin, View, Preview } from "guichat-plugin-{plugin-name}/react";
```

### Core Only (Framework-agnostic)

```typescript
import { pluginCore, TOOL_NAME } from "guichat-plugin-{plugin-name}";
// or
import pluginCore from "guichat-plugin-{plugin-name}";
```

## Package Exports

| Export | Description |
|--------|-------------|
| `guichat-plugin-{plugin-name}` | Core (framework-agnostic) |
| `guichat-plugin-{plugin-name}/vue` | Vue implementation with UI components |
| `guichat-plugin-{plugin-name}/react` | React implementation with UI components |
| `guichat-plugin-{plugin-name}/style.css` | Tailwind CSS styles |

## Development

```bash
# Install dependencies
yarn install

# Start dev server - Vue (http://localhost:5173/)
yarn dev

# Start dev server - React (http://localhost:5173/)
yarn dev:react

# Build
yarn build

# Type check
yarn typecheck

# Lint
yarn lint
```

## Test Prompts

Try these prompts to test the plugin:

1. "{test-prompt-1}"
2. "{test-prompt-2}"
3. "{test-prompt-3}"

## License

MIT
