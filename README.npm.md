# @mulmochat-plugin/{plugin-name}

[![npm version](https://badge.fury.io/js/%40mulmochat-plugin%2F{plugin-name}.svg)](https://www.npmjs.com/package/@mulmochat-plugin/{plugin-name})

A plugin for [MulmoChat](https://github.com/receptron/MulmoChat) - a multi-modal voice chat application with OpenAI's GPT-4 Realtime API.

## What this plugin does

{plugin-description}

## Installation

```bash
yarn add @mulmochat-plugin/{plugin-name}
```

## Usage

### Vue Implementation (for MulmoChat)

```typescript
// In src/tools/index.ts
import Plugin from "@mulmochat-plugin/{plugin-name}/vue";

const pluginList = [
  // ... other plugins
  Plugin,
];

// In src/main.ts
import "@mulmochat-plugin/{plugin-name}/style.css";
```

### React Implementation

```typescript
import Plugin from "@mulmochat-plugin/{plugin-name}/react";
import "@mulmochat-plugin/{plugin-name}/style.css";

// Named exports
import { plugin, View, Preview } from "@mulmochat-plugin/{plugin-name}/react";
```

### Core Only (Framework-agnostic)

```typescript
import { pluginCore, TOOL_NAME } from "@mulmochat-plugin/{plugin-name}";
// or
import pluginCore from "@mulmochat-plugin/{plugin-name}";
```

## Package Exports

| Export | Description |
|--------|-------------|
| `@mulmochat-plugin/{plugin-name}` | Core (framework-agnostic) |
| `@mulmochat-plugin/{plugin-name}/vue` | Vue implementation with UI components |
| `@mulmochat-plugin/{plugin-name}/react` | React implementation with UI components |
| `@mulmochat-plugin/{plugin-name}/style.css` | Tailwind CSS styles |

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
