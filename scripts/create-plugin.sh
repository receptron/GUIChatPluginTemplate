#!/bin/bash

# MulmoChat Plugin Generator Script
# Usage: ./scripts/create-plugin.sh <plugin-name> <display-name> <description>
# Example: ./scripts/create-plugin.sh my-plugin "My Plugin" "A plugin that does something"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 3 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo "Usage: $0 <plugin-name> <display-name> <description>"
    echo "Example: $0 my-plugin \"My Plugin\" \"A plugin that does something\""
    exit 1
fi

PLUGIN_NAME_KEBAB="$1"           # e.g., "my-plugin"
DISPLAY_NAME="$2"                # e.g., "My Plugin"
DESCRIPTION="$3"                 # e.g., "A plugin that does something"

# Convert kebab-case to PascalCase for class/variable names
PLUGIN_NAME_PASCAL=$(echo "$PLUGIN_NAME_KEBAB" | sed -r 's/(^|-)([a-z])/\U\2/g')

# Convert kebab-case to camelCase for tool names
PLUGIN_NAME_CAMEL=$(echo "$PLUGIN_NAME_PASCAL" | sed 's/^\(.\)/\l\1/')

# Destination directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(dirname "$SCRIPT_DIR")"
DEST_DIR="$(dirname "$TEMPLATE_DIR")/MulmoChatPlugin${PLUGIN_NAME_PASCAL}"

echo -e "${GREEN}Creating MulmoChat Plugin: ${DISPLAY_NAME}${NC}"
echo "  Package name: @mulmochat-plugin/${PLUGIN_NAME_KEBAB}"
echo "  Directory: ${DEST_DIR}"
echo ""

# Check if destination already exists
if [ -d "$DEST_DIR" ]; then
    echo -e "${RED}Error: Directory already exists: ${DEST_DIR}${NC}"
    exit 1
fi

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p "$DEST_DIR/src/common"
mkdir -p "$DEST_DIR/src/plugin"
mkdir -p "$DEST_DIR/demo"
mkdir -p "$DEST_DIR/.github/workflows"

# Copy files that don't need modification
echo -e "${YELLOW}Copying template files...${NC}"
cp "$TEMPLATE_DIR/eslint.config.js" "$DEST_DIR/"
cp "$TEMPLATE_DIR/vite.config.ts" "$DEST_DIR/"
cp "$TEMPLATE_DIR/index.html" "$DEST_DIR/"
cp "$TEMPLATE_DIR/.github/workflows/pull_request.yaml" "$DEST_DIR/.github/workflows/"
cp "$TEMPLATE_DIR/src/shims-vue.d.ts" "$DEST_DIR/src/"
cp "$TEMPLATE_DIR/src/common/types.ts" "$DEST_DIR/src/common/"
cp "$TEMPLATE_DIR/src/common/index.ts" "$DEST_DIR/src/common/"
cp "$TEMPLATE_DIR/src/style.css" "$DEST_DIR/src/"
cp "$TEMPLATE_DIR/src/index.ts" "$DEST_DIR/src/"
cp "$TEMPLATE_DIR/demo/main.ts" "$DEST_DIR/demo/"
cp "$TEMPLATE_DIR/demo/App.vue" "$DEST_DIR/demo/"
cp "$TEMPLATE_DIR/tsconfig.json" "$DEST_DIR/"
cp "$TEMPLATE_DIR/tsconfig.build.json" "$DEST_DIR/"
cp "$TEMPLATE_DIR/.gitignore" "$DEST_DIR/"

# Generate package.json
echo -e "${YELLOW}Generating package.json...${NC}"
cat > "$DEST_DIR/package.json" << EOF
{
  "name": "@mulmochat-plugin/${PLUGIN_NAME_KEBAB}",
  "version": "0.1.0",
  "description": "${DESCRIPTION}",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./style.css": "./dist/style.css"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "vite",
    "build": "vite build && vue-tsc -p tsconfig.build.json --emitDeclarationOnly",
    "typecheck": "vue-tsc --noEmit",
    "lint": "eslint src demo"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "@typescript-eslint/eslint-plugin": "^8.53.0",
    "@typescript-eslint/parser": "^8.53.0",
    "@vitejs/plugin-vue": "^6.0.3",
    "eslint": "^9.39.2",
    "eslint-plugin-vue": "^10.6.2",
    "globals": "^17.0.0",
    "tailwindcss": "^4.1.18",
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "vue": "^3.5.26",
    "vue-eslint-parser": "^10.2.0",
    "vue-tsc": "^3.2.2"
  },
  "keywords": [
    "mulmochat",
    "plugin",
    "${PLUGIN_NAME_KEBAB}"
  ],
  "license": "MIT"
}
EOF

# Generate README.md from template
echo -e "${YELLOW}Generating README.md...${NC}"
sed -e "s/{plugin-name}/${PLUGIN_NAME_KEBAB}/g" -e "s/{plugin-description}/${DESCRIPTION}/g" "$TEMPLATE_DIR/README.npm.md" > "$DEST_DIR/README.md"

# Generate src/plugin/types.ts
echo -e "${YELLOW}Generating src/plugin/types.ts...${NC}"
cat > "$DEST_DIR/src/plugin/types.ts" << EOF
/**
 * ${DISPLAY_NAME} Tool Definition and Types
 */

// ============================================================================
// Types
// ============================================================================

/** Data type (stored in result.data) */
export interface ${PLUGIN_NAME_PASCAL}ToolData {
  // TODO: Define your plugin data structure
  message?: string;
}

/** Arguments type (passed from LLM) */
export interface ${PLUGIN_NAME_PASCAL}Args {
  // TODO: Define your plugin arguments
  input: string;
}

// ============================================================================
// Tool Definition
// ============================================================================

export const TOOL_NAME = "${PLUGIN_NAME_CAMEL}";

export const TOOL_DEFINITION = {
  type: "function" as const,
  name: TOOL_NAME,
  description: "${DESCRIPTION}",
  parameters: {
    type: "object" as const,
    properties: {
      input: {
        type: "string",
        description: "Input for the plugin",
      },
    },
    required: ["input"],
  },
};
EOF

# Generate src/plugin/index.ts
echo -e "${YELLOW}Generating src/plugin/index.ts...${NC}"
cat > "$DEST_DIR/src/plugin/index.ts" << EOF
/**
 * MulmoChat ${DISPLAY_NAME} Plugin
 */

import type { ToolPlugin, ToolContext, ToolResult } from "../common";
import {
  TOOL_DEFINITION,
  type ${PLUGIN_NAME_PASCAL}ToolData,
  type ${PLUGIN_NAME_PASCAL}Args,
} from "./types";
import View from "./View.vue";
import Preview from "./Preview.vue";

// ============================================================================
// Plugin Implementation
// ============================================================================

const execute${PLUGIN_NAME_PASCAL} = async (
  _context: ToolContext,
  args: ${PLUGIN_NAME_PASCAL}Args,
): Promise<ToolResult<${PLUGIN_NAME_PASCAL}ToolData>> => {
  // TODO: Implement your plugin logic
  const { input } = args;

  return {
    message: "Plugin executed successfully",
    data: {
      message: \`Received: \${input}\`,
    },
    instructions: "Tell the user the result.",
  };
};

// ============================================================================
// Export
// ============================================================================

export const plugin: ToolPlugin<${PLUGIN_NAME_PASCAL}ToolData, unknown, ${PLUGIN_NAME_PASCAL}Args> = {
  toolDefinition: TOOL_DEFINITION,
  execute: execute${PLUGIN_NAME_PASCAL},
  generatingMessage: "Processing...",
  isEnabled: () => true,
  viewComponent: View,
  previewComponent: Preview,
  samples: [
    {
      name: "Sample Input",
      args: {
        input: "Hello, World!",
      },
    },
  ],
};
EOF

# Generate src/plugin/View.vue
echo -e "${YELLOW}Generating src/plugin/View.vue...${NC}"
cat > "$DEST_DIR/src/plugin/View.vue" << EOF
<template>
  <div class="size-full overflow-y-auto p-8 bg-[#1a1a2e]">
    <div v-if="data" class="max-w-3xl w-full mx-auto">
      <h2 class="text-[#f0f0f0] text-3xl font-bold mb-8 text-center">
        ${DISPLAY_NAME}
      </h2>
      <div class="bg-[#2d2d44] rounded-lg p-6 border-2 border-[#3d3d5c]">
        <p class="text-white">{{ data.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "../common";
import type { ${PLUGIN_NAME_PASCAL}ToolData } from "./types";
import { TOOL_NAME } from "./types";

const props = defineProps<{
  selectedResult: ToolResult<${PLUGIN_NAME_PASCAL}ToolData>;
  sendTextMessage: (text?: string) => void;
}>();

defineEmits<{
  updateResult: [result: ToolResult];
}>();

// IMPORTANT: Use ref + watch pattern (computed doesn't work properly with external packages)
const data = ref<${PLUGIN_NAME_PASCAL}ToolData | null>(null);

watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.data) {
      data.value = newResult.data as ${PLUGIN_NAME_PASCAL}ToolData;
    }
  },
  { immediate: true, deep: true },
);
</script>
EOF

# Generate src/plugin/Preview.vue
echo -e "${YELLOW}Generating src/plugin/Preview.vue...${NC}"
cat > "$DEST_DIR/src/plugin/Preview.vue" << EOF
<template>
  <div class="p-3 bg-blue-50 rounded-md">
    <div class="flex flex-col gap-2">
      <div class="text-sm font-semibold text-gray-800 text-center">
        ${DISPLAY_NAME}
      </div>
      <div class="text-xs text-gray-600 overflow-hidden line-clamp-2">
        {{ data?.message || "No data" }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ToolResult } from "../common";
import type { ${PLUGIN_NAME_PASCAL}ToolData } from "./types";

const props = defineProps<{
  result: ToolResult<${PLUGIN_NAME_PASCAL}ToolData>;
}>();

const data = computed(() => props.result.data);
</script>
EOF

echo ""
echo -e "${GREEN}✅ Plugin created successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. cd ${DEST_DIR}"
echo "  2. yarn install"
echo "  3. yarn dev"
echo ""
echo "Then implement your plugin logic in:"
echo "  - src/plugin/types.ts  (data types and tool definition)"
echo "  - src/plugin/index.ts  (plugin execution logic)"
echo "  - src/plugin/View.vue  (main view component)"
echo "  - src/plugin/Preview.vue (sidebar preview)"
echo ""
echo "See TEMPLATE.md for detailed instructions."
