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
  "name": "guichat-plugin-your-plugin-name",
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
# guichat-plugin-your-plugin-name

Description of your plugin.

## Installation

\`\`\`bash
npm install guichat-plugin-your-plugin-name
\`\`\`

## Usage

### Vue

\`\`\`typescript
import { plugin } from "guichat-plugin-your-plugin-name/vue";
import "guichat-plugin-your-plugin-name/style.css";
\`\`\`

### React

\`\`\`typescript
import { plugin } from "guichat-plugin-your-plugin-name/react";
import "guichat-plugin-your-plugin-name/style.css";
\`\`\`

### Core (Framework-agnostic)

\`\`\`typescript
import { pluginCore, executeYourPlugin } from "guichat-plugin-your-plugin-name/core";
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

### Publish

```bash
npm publish
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
npm publish
```

## Step 3: Use in MulmoChat

### Install Your Plugin

In MulmoChat directory:

```bash
npm install guichat-plugin-your-plugin-name
```

Or for local development:

```bash
# In package.json
{
  "dependencies": {
    "guichat-plugin-your-plugin-name": "file:../GUIChatPluginYourName"
  }
}
```

### Register Plugin

Edit `src/tools/index.ts`:

```typescript
// Import your plugin
import { plugin as yourPlugin } from "guichat-plugin-your-plugin-name/vue";

// Add to plugins array
export const plugins = [
  // ... existing plugins
  yourPlugin,
];
```

### CSS (Automatic)

MulmoChat's `src/index.css` uses `@source` to automatically include plugin styles:

```css
@source "../node_modules/@gui-chat-plugin/*/dist/vue.js";
```

**No manual import needed** - plugin styles are automatically included.

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
1. `style.css` is in `files` array in package.json
2. Export path `./style.css` is correct in package.json exports
3. MulmoChat's `src/index.css` has `@source` directive for your plugin path
4. You are NOT using Tailwind arbitrary values (e.g., `bg-[#1a1a2e]`)

### Build files missing

Run `npm run build` before publishing. Check `vite.config.ts` for correct output configuration.

## GitHub Installation (Without npm Publish)

If you want to test your plugin in MulmoChat before publishing to npm, you can install directly from GitHub.

### Step 1: Build and Commit dist

```bash
# Build the plugin
yarn build

# Force add dist (normally gitignored)
git add -f dist

# Commit
git commit -m "build: add dist for GitHub installation"

# Push to GitHub
git push origin main
```

### Step 2: Add to MulmoChat

In MulmoChat's `package.json`, add your plugin using GitHub reference:

```json
{
  "dependencies": {
    "@gui-chat-plugin/your-plugin": "github:your-username/GUIChatPluginYourName"
  }
}
```

Then install:

```bash
yarn install
```

### Step 3: Configure MulmoChat

You need to make changes in the MulmoChat repository:

#### 3a. Register Plugin (src/tools/index.ts)

```typescript
// Add import at the top
import YourPlugin from "@gui-chat-plugin/your-plugin/vue";

// Add to pluginList array
const pluginList = [
  // ... existing plugins
  YourPlugin,
];
```

#### 3b. CSS (Automatic via @source)

MulmoChat uses Tailwind's `@source` directive to automatically include plugin styles:

```css
/* src/index.css - already configured */
@source "../node_modules/@gui-chat-plugin/*/dist/vue.js";
```

**No manual CSS import needed** - just make sure your plugin uses standard Tailwind classes (no arbitrary values like `bg-[#1a1a2e]`).

#### 3c. (Optional) Pass API Keys to View Component

If your plugin requires API keys, update `src/views/HomeView.vue`:

```vue
<component
  :is="getToolPlugin(selectedResult.toolName!).viewComponent"
  :selected-result="selectedResult"
  :your-api-key="startResponse?.yourApiKey || null"
/>
```

And add to `server/routes/api.ts`:

```typescript
const yourApiKey = process.env.YOUR_API_KEY;

// In the start endpoint response
res.json({
  // ... other fields
  yourApiKey,
});
```

### Step 4: Test

```bash
yarn install
yarn typecheck
yarn dev
```

### Important Notes

- **dist must be committed**: GitHub installation requires built files
- **Update dist on changes**: Run `git add -f dist && git commit` after each build
- **Switch to npm later**: Once stable, publish to npm and update package.json reference

---

## Local Development with MulmoChat

For developing your plugin alongside MulmoChat:

### Option 1: npm link

```bash
# In your plugin directory
npm link

# In MulmoChat directory
npm link guichat-plugin-your-plugin-name
```

### Option 2: File reference

In MulmoChat's `package.json`:

```json
{
  "dependencies": {
    "guichat-plugin-your-plugin-name": "file:../GUIChatPluginYourName"
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

## Package Naming Convention

Use the `guichat-plugin-` prefix for consistency with other GUIChat plugins:

```json
{
  "name": "guichat-plugin-your-plugin-name"
}
```

## Related Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [MulmoChat Repository](https://github.com/receptron/MulmoChat)
