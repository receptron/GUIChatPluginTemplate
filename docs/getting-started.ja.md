# はじめに - 初めてのプラグイン

このガイドでは、初めてのGUIChatプラグインを一歩ずつ作成します。プラグイン開発の経験は不要です！

## 作るもの

シンプルな「グリーティングカード」プラグイン：
- 名前を入力として受け取る
- パーソナライズされたグリーティングカードを表示

## 前提条件

- Node.js 18以上がインストール済み
- TypeScriptの基本知識
- VueまたはReactの基本知識

## ステップ1: プロジェクトのセットアップ

```bash
# テンプレートをクローン
git clone https://github.com/receptron/GUIChatPluginTemplate.git GUIChatPluginGreeting
cd GUIChatPluginGreeting

# 依存関係をインストール
npm install
```

## ステップ2: デモを実行

```bash
npm run dev
```

http://localhost:5173 を開きます。Quizデモが動作しているはずです。

**試してみよう：**
1. Quick Samplesセクションの「Simple Quiz」ボタンをクリック
2. Quiz Viewが表示される
3. 質問に答える

## ステップ3: テンプレートを理解する

変更を加える前に、各ファイルの役割を理解しましょう：

```
src/
├── core/                    # プラグインロジック（UIなし）
│   ├── definition.ts        # ツール名とパラメータ
│   ├── plugin.ts           # メインのexecute関数
│   ├── types.ts            # TypeScript型
│   └── samples.ts          # テストデータ
└── vue/                     # Vue UIコンポーネント
    ├── View.vue            # メイン表示
    └── Preview.vue         # サムネイル
```

## ステップ4: ツールを定義する (definition.ts)

`src/core/definition.ts` を編集：

```typescript
import type { ToolDefinition } from "gui-chat-protocol";

// ツール名（結果の識別に使用）
export const TOOL_NAME = "greetingCard";

// LLM向けのツール定義
export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description: "カスタムメッセージ付きのパーソナライズされたグリーティングカードを作成",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "挨拶する相手の名前",
      },
      message: {
        type: "string",
        description: "オプションのカスタムメッセージ",
      },
    },
    required: ["name"],
  },
};

// システムプロンプト（LLMへのオプション指示）
export const SYSTEM_PROMPT = `ユーザーが挨拶を作成したい、または誰かにメッセージを送りたいときは、${TOOL_NAME}ツールを使用してください。`;
```

**ポイント：**
- `TOOL_NAME`: プラグインの一意の識別子
- `description`: LLMにこのツールをいつ使うか伝える
- `parameters`: ツールが受け取る入力を定義

## ステップ5: 型を定義する (types.ts)

`src/core/types.ts` を編集：

```typescript
/**
 * View/Previewコンポーネント用のデータ
 */
export interface GreetingData {
  name: string;
  message: string;
  createdAt: string;
}

/**
 * execute関数に渡される引数
 */
export interface GreetingArgs {
  name: string;
  message?: string;
}
```

## ステップ6: Execute関数を実装する (plugin.ts)

`src/core/plugin.ts` を編集：

```typescript
import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";
import type { GreetingData, GreetingArgs } from "./types";
import { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT } from "./definition";
import { SAMPLES } from "./samples";

export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT } from "./definition";

/**
 * Execute関数 - LLMがこのツールを呼び出すと実行される
 */
export const executeGreeting = async (
  _context: ToolContext,
  args: GreetingArgs,
): Promise<ToolResult<GreetingData, never>> => {
  const { name, message } = args;

  // グリーティングデータを作成
  const greetingData: GreetingData = {
    name,
    message: message || `こんにちは、${name}さん！ようこそ！`,
    createdAt: new Date().toLocaleString("ja-JP"),
  };

  return {
    toolName: TOOL_NAME,
    message: `${name}さんへのグリーティングカードを作成しました`,
    data: greetingData,
    instructions: "グリーティングカードが作成されたことをユーザーに伝えてください。",
  };
};

/**
 * プラグインコア（フレームワーク非依存）
 */
export const pluginCore: ToolPluginCore<GreetingData, never, GreetingArgs> = {
  toolDefinition: TOOL_DEFINITION,
  execute: executeGreeting,
  generatingMessage: "グリーティングカードを作成中...",
  isEnabled: () => true,
  systemPrompt: SYSTEM_PROMPT,
  samples: SAMPLES,
};
```

**ポイント：**
- `execute()` はLLMから`args`を受け取る
- Viewコンポーネント用の`data`を含む`ToolResult`を返す
- `message`はLLMに送り返される
- `instructions`はLLMに次に何を言うか伝える

## ステップ7: テストサンプルを追加する (samples.ts)

`src/core/samples.ts` を編集：

```typescript
import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "シンプルな挨拶",
    args: {
      name: "田中",
    },
  },
  {
    name: "カスタムメッセージ",
    args: {
      name: "佐藤",
      message: "お誕生日おめでとうございます！素敵な一年になりますように！",
    },
  },
  {
    name: "ようこそカード",
    args: {
      name: "新規ユーザー",
      message: "コミュニティへようこそ！",
    },
  },
];
```

## ステップ8: Viewコンポーネントを作成する (Vue)

`src/vue/View.vue` を編集：

```vue
<template>
  <div v-if="greetingData" class="w-full min-h-[300px] p-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
    <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
      <!-- カードヘッダー -->
      <div class="text-4xl mb-4">
        🎉
      </div>

      <!-- 挨拶 -->
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        こんにちは、{{ greetingData.name }}さん！
      </h2>

      <!-- メッセージ -->
      <p class="text-gray-600 text-lg mb-6">
        {{ greetingData.message }}
      </p>

      <!-- フッター -->
      <div class="text-sm text-gray-400">
        作成日時: {{ greetingData.createdAt }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol/vue";
import type { GreetingData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult<GreetingData>;
  sendTextMessage?: (text?: string) => void;
}>();

const greetingData = ref<GreetingData | null>(null);

// 結果の変更を監視
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.data) {
      greetingData.value = newResult.data;
    }
  },
  { immediate: true, deep: true }
);
</script>
```

## ステップ9: Previewコンポーネントを作成する (Vue)

`src/vue/Preview.vue` を編集：

```vue
<template>
  <div class="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg text-center">
    <div class="text-2xl mb-1">🎉</div>
    <div class="text-sm font-medium text-purple-700 truncate">
      {{ result.data?.name || "グリーティング" }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolResult } from "gui-chat-protocol/vue";
import type { GreetingData } from "../core/types";

defineProps<{
  result: ToolResult<GreetingData>;
}>();
</script>
```

## ステップ10: エクスポートを更新する

### src/core/index.ts

```typescript
export type { GreetingData, GreetingArgs } from "./types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, executeGreeting, pluginCore } from "./plugin";
export { SAMPLES } from "./samples";
```

### src/vue/index.ts

```typescript
import "../style.css";
import type { ToolPlugin } from "gui-chat-protocol/vue";
import type { GreetingData, GreetingArgs } from "../core/types";
import { pluginCore } from "../core/plugin";
import { SAMPLES } from "../core/samples";
import View from "./View.vue";
import Preview from "./Preview.vue";

export const plugin: ToolPlugin<GreetingData, never, GreetingArgs> = {
  ...pluginCore,
  viewComponent: View,
  previewComponent: Preview,
  samples: SAMPLES,
};

export type { GreetingData, GreetingArgs } from "../core/types";
export { TOOL_NAME, TOOL_DEFINITION, SYSTEM_PROMPT, executeGreeting, pluginCore } from "../core/plugin";
export { SAMPLES } from "../core/samples";
export { View, Preview };

export default { plugin };
```

## ステップ11: package.jsonを更新する

`package.json` を編集：

```json
{
  "name": "@gui-chat-plugin/greeting",
  "description": "GUIChat用のグリーティングカードプラグイン"
}
```

## ステップ12: プラグインをテストする

```bash
npm run dev
```

1. Quick Samplesの「シンプルな挨拶」をクリック
2. グリーティングカードが表示される！
3. 他のサンプルも試してみる

## ステップ13: チャットでテストする

デモで：
1. 「田中さんへの挨拶を作って」と入力
2. Mockモードでは、「greeting 田中」と入力してプラグインをトリガー
3. Real APIモード（OpenAIキー使用時）では、LLMが自動的にツールを呼び出す

## トラブルシューティング

### Viewが何も表示されない

確認すること：
- `TOOL_NAME`がdefinition.tsとexecuteの戻り値で一致している
- 戻り値に`toolName`が含まれている
- 型が正しくエクスポートされている

### サンプルが動作しない

確認すること：
- `SAMPLES`がsamples.tsからエクスポートされている
- 引数が`GreetingArgs`型と一致している
- `samples`が`pluginCore`に含まれている

### TypeScriptエラー

以下を実行：
```bash
npm run typecheck
```

型とコンポーネントpropsの間の不一致を修正する。

## 次のステップ

1. **インタラクティブ性を追加**: `sendTextMessage`を使ってチャットにメッセージを送る
2. **状態を追加**: `viewState`を使ってUI状態を永続化
3. **スタイルを整える**: Tailwind CSSで美しいデザイン
4. **公開**: [npm公開ガイド](./npm-publishing-guide.md)に従う

## まとめ

学んだこと：

1. ツールスキーマを定義する (definition.ts)
2. 型を作成する (types.ts)
3. execute関数を実装する (plugin.ts)
4. テストサンプルを追加する (samples.ts)
5. Viewコンポーネントを構築する (View.vue)
6. Previewコンポーネントを構築する (Preview.vue)

基本パターン：

```
LLMがツールを呼び出す → execute()がデータを返す → Viewがデータを表示
```

初めてのプラグイン作成おめでとうございます！
