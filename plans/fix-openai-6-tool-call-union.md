# Fix: openai 4 → 6 migration — demo `useChat.ts` tool-call union

Issue: https://github.com/receptron/GUIChatPluginTemplate/issues/20

## Problem

PR #19 bumped most deps but reverted `openai ^4.77.0 → ^6.45.0` because CI typecheck failed:

```
demo/vue/useChat.ts, demo/react/useChat.ts: error TS2339:
  Property 'function' does not exist on type 'ChatCompletionMessageToolCall'.
  Property 'function' does not exist on type 'ChatCompletionMessageCustomToolCall'.
```

## Root cause

`openai@6` re-typed `ChatCompletionMessageToolCall` as a discriminated union:

```ts
type ChatCompletionMessageToolCall =
  | ChatCompletionMessageFunctionToolCall  // { type: "function", function: {...} }
  | ChatCompletionMessageCustomToolCall    // { type: "custom",   custom:   {...} }
```

The demo reads `tc.function.name` / `tc.function.arguments` directly, which only exists on
the `function` variant.

## Fix

Narrow the union before reading the function payload. Both files map over `message.tool_calls`,
so filter to the function variant first (TypeScript 6 infers the type predicate from the
`.filter` callback, so no cast is needed):

```ts
const toolCalls = message.tool_calls
  .filter((tc) => tc.type === "function")
  .map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: tc.function.arguments,
  }));
```

Files:
- `demo/vue/useChat.ts`
- `demo/react/useChat.ts`

`package.json` keeps `openai: ^6.45.0`.

## Verification

- `yarn typecheck` — passes (was the CI failure)
- `yarn lint` — passes
- `yarn build` — passes
- demo mock-mode smoke test
