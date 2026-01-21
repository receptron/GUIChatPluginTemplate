# npm Publishing Guide

This guide covers how to publish your GUIChat plugin to npm and use it in MulmoChat.

## Prerequisites

- npm account ([sign up](https://www.npmjs.com/signup))
- Plugin development complete (all tests passing)
- Git repository set up

## Step 1: Prepare for Publishing

### Update package.json

```json
{
  "name": "@gui-chat-plugin/your-plugin-name",
  "version": "0.1.0",
  "description": "Your plugin description",
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
    "./core": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core.js",
      "require": "./dist/core.cjs"
    },
    "./vue": {
      "types": "./dist/vue/index.d.ts",
      "import": "./dist/vue.js",
      "require": "./dist/vue.cjs"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react.js",
      "require": "./dist/react.cjs"
    },
    "./style.css": "./dist/style.css"
  },
  "files": [
    "dist"
  ],
  "keywords": [
    "guichat",
    "plugin",
    "your-keyword"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/GUIChatPluginYourName.git"
  }
}
```

### Create README.md for npm

Create a `README.md` at the project root:

```markdown
# @gui-chat-plugin/your-plugin-name

Description of your plugin.

## Installation

\`\`\`bash
npm install @gui-chat-plugin/your-plugin-name
\`\`\`

## Usage

### Vue

\`\`\`typescript
import { plugin } from "@gui-chat-plugin/your-plugin-name/vue";
import "@gui-chat-plugin/your-plugin-name/style.css";
\`\`\`

### React

\`\`\`typescript
import { plugin } from "@gui-chat-plugin/your-plugin-name/react";
import "@gui-chat-plugin/your-plugin-name/style.css";
\`\`\`

### Core (Framework-agnostic)

\`\`\`typescript
import { pluginCore, executeYourPlugin } from "@gui-chat-plugin/your-plugin-name/core";
\`\`\`

## Test Prompts

Try these prompts in MulmoChat:

- "Show me a ..."
- "Create a ..."
- "I want to ..."

## License

MIT
```

### Verify Build

```bash
npm run build
npm run typecheck
npm run lint
```

Check that `dist/` contains:
- `index.js`, `index.cjs`, `index.d.ts`
- `core.js`, `core.cjs`
- `vue.js`, `vue.cjs`
- `react.js`, `react.cjs`
- `style.css`

## Step 2: Publish to npm

### Login to npm

```bash
npm login
```

### Publish (Scoped Package)

For scoped packages like `@gui-chat-plugin/xxx`:

```bash
npm publish --access public
```

### Version Updates

For subsequent updates:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm version patch

# Minor version (0.1.0 -> 0.2.0)
npm version minor

# Major version (0.1.0 -> 1.0.0)
npm version major

# Then publish
npm publish --access public
```

## Step 3: Use in MulmoChat

### Install Your Plugin

In MulmoChat directory:

```bash
npm install @gui-chat-plugin/your-plugin-name
```

Or for local development:

```bash
# In package.json
{
  "dependencies": {
    "@gui-chat-plugin/your-plugin-name": "file:../GUIChatPluginYourName"
  }
}
```

### Register Plugin

Edit `src/tools/index.ts`:

```typescript
// Import your plugin
import { plugin as yourPlugin } from "@gui-chat-plugin/your-plugin-name/vue";

// Add to plugins array
export const plugins = [
  // ... existing plugins
  yourPlugin,
];
```

### Import CSS

Edit `src/main.ts`:

```typescript
// Import plugin styles
import "@gui-chat-plugin/your-plugin-name/style.css";
```

### Verify Integration

```bash
npm install
npm run typecheck
npm run dev
```

Test your plugin in the running MulmoChat app.

## Publishing Checklist

### Before Publishing

- [ ] `package.json` name and version correct
- [ ] `README.md` with usage instructions
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` no errors
- [ ] `npm run lint` no errors
- [ ] All files in `dist/` generated correctly
- [ ] Test samples work in demo

### After Publishing

- [ ] Package visible on [npmjs.com](https://www.npmjs.com)
- [ ] Can install in fresh project
- [ ] Works in MulmoChat

## Troubleshooting

### "Package not found" after publish

Wait a few minutes for npm registry to update.

### Types not working

Ensure `types` field in exports points to correct `.d.ts` files.

### CSS not loading

Check:
1. `style.css` is in `files` array
2. Export path `./style.css` is correct
3. Import path in MulmoChat is correct

### Build files missing

Run `npm run build` before publishing. Check `vite.config.ts` for correct output configuration.

## Local Development with MulmoChat

For developing your plugin alongside MulmoChat:

### Option 1: npm link

```bash
# In your plugin directory
npm link

# In MulmoChat directory
npm link @gui-chat-plugin/your-plugin-name
```

### Option 2: File reference

In MulmoChat's `package.json`:

```json
{
  "dependencies": {
    "@gui-chat-plugin/your-plugin-name": "file:../GUIChatPluginYourName"
  }
}
```

Then run:

```bash
npm install
```

### Watch Mode

Run build in watch mode for live updates:

```bash
# In plugin directory - rebuild on changes
npm run build -- --watch

# In MulmoChat directory
npm run dev
```

## Versioning Best Practices

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes to API
- **MINOR** (0.1.0): New features, backwards compatible
- **PATCH** (0.0.1): Bug fixes, backwards compatible

Example:
- Change `TOOL_DEFINITION` parameters → MAJOR
- Add new sample → MINOR
- Fix typo in message → PATCH

## npm Organization

To publish under `@gui-chat-plugin` organization, you need:

1. Membership in the organization
2. Permission to publish packages

Contact the organization admin if you need access.

Alternatively, use your own scope:

```json
{
  "name": "@your-username/guichat-plugin-name"
}
```

## Related Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [MulmoChat Repository](https://github.com/receptron/MulmoChat)
