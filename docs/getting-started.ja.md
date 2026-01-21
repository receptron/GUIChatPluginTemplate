# はじめに - 初めてのプラグイン

このガイドでは、初めてのGUIChatプラグインを一歩ずつ作成します。プラグイン開発の経験は不要です！

## 作るもの

シンプルな「グリーティングカード」プラグイン：
- 名前を入力として受け取る
- パーソナライズされたグリーティングカードを表示

## 前提条件

- Node.js 22以上がインストール済み
- TypeScriptの基本知識
- VueまたはReactの基本知識

## ステップ1: プロジェクトのセットアップ

```bash
# テンプレートをクローン
git clone https://github.com/receptron/GUIChatPluginTemplate.git GUIChatPluginGreeting
cd GUIChatPluginGreeting

# 依存関係をインストール
yarn install
```

## ステップ2: デモを実行

```bash
yarn dev
```

http://localhost:5173 を開きます。Quizデモが動作しているはずです。

**試してみよう：**
1. Quick Samplesセクションの「Simple Quiz」ボタンをクリック
2. Quiz Viewが表示される
3. 質問に答える

## ステップ2.5: Mock Modeを理解する（重要）

### Mock Modeとは？

デモには2つのモードがあります：

| モード | APIキー | 用途 |
|--------|---------|------|
| **Mock Mode** | 不要 | 開発・テスト用。キーワードで疑似的にLLM応答を返す |
| **Real API Mode** | 必要 | 本番テスト用。実際のOpenAI APIを使用 |

**初心者はまずMock Modeで開発しましょう！** APIキー不要で、プラグインの動作確認ができます。

### Mock Modeの仕組み

```
ユーザーが入力 → キーワードをチェック → マッチしたらツール呼び出し
```

例：ユーザーが「quiz を作って」と入力
1. メッセージに「quiz」が含まれているかチェック
2. 含まれていれば、`putQuestions`ツールを呼び出すモックレスポンスを返す
3. プラグインが実行され、Viewに表示される

### デフォルトのキーワード

`demo/shared/chat-utils.ts`に定義されています：

| キーワード | 動作 |
|-----------|------|
| `quiz`, `question` | Quizプラグインのツールを呼び出す |
| `hello`, `hi` | テキストで挨拶を返す |
| その他 | デフォルトのテキスト応答 |

### 自分のプラグイン用にMockを追加する

**これが重要！** 新しいプラグインを作ったら、Mock Modeでテストするためにモックレスポンスを追加します。

`demo/shared/chat-utils.ts`を編集：

```typescript
export const DEFAULT_MOCK_RESPONSES: Record<string, MockResponse> = {
  // 既存のquiz
  quiz: {
    toolCall: {
      name: "putQuestions",
      args: { /* ... */ },
    },
  },

  // ✏️ 自分のプラグイン用を追加
  greeting: {
    toolCall: {
      name: "greetingCard",  // TOOL_NAMEと一致させる
      args: {
        name: "田中",
        message: "こんにちは！",
      },
    },
  },

  // ...
};
```

次に、`findMockResponse`関数にキーワード判定を追加：

```typescript
export const findMockResponse = (
  userMessage: string,
  mockResponses: Record<string, MockResponse> = DEFAULT_MOCK_RESPONSES
): MockResponse => {
  const lowerMessage = userMessage.toLowerCase();

  // 既存
  if (lowerMessage.includes("quiz") || lowerMessage.includes("question")) {
    return mockResponses.quiz || DEFAULT_MOCK_RESPONSES.quiz;
  }

  // ✏️ 自分のプラグイン用を追加
  if (lowerMessage.includes("greeting") || lowerMessage.includes("挨拶")) {
    return mockResponses.greeting || DEFAULT_MOCK_RESPONSES.default;
  }

  // ...
};
```

### Mock Modeでテスト

1. デモ画面で「Mock Mode」がONになっていることを確認
2. チャットに「挨拶を作って」と入力
3. キーワード「挨拶」がマッチ → greetingCardツールが呼ばれる
4. プラグインが実行され、Viewに表示される

### Real API Modeに切り替え

本番に近い動作を確認したい場合：

1. `.env`ファイルを作成：
   ```bash
   echo "VITE_OPENAI_API_KEY=sk-your-api-key" > .env
   ```
2. デモを再起動：`yarn dev`
3. 「Mock Mode」をOFFに切り替え
4. 自然な日本語で話しかける（「田中さんへの挨拶カードを作って」など）
5. LLMが適切なタイミングでツールを自動的に呼び出す

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

### Execute関数とは？

Execute関数は**プラグインの心臓部**です。LLMがツールを呼び出したときに実行されます。

```
LLMが「greetingCardツールを使おう」と判断
    ↓
execute(context, args) が呼ばれる
    ↓
ToolResultを返す
    ↓
View/Previewコンポーネントに表示される
    ↓
LLMにも結果が伝えられ、次の応答を生成
```

### Execute関数の引数

```typescript
execute(context: ToolContext, args: GreetingArgs): Promise<ToolResult>
```

| 引数 | 説明 |
|------|------|
| `context` | 実行コンテキスト。`currentResult`（前回の結果）などを含む |
| `args` | LLMが渡した引数。definition.tsで定義したパラメータに基づく |

### ToolResultの構造（戻り値）

```typescript
interface ToolResult<T, J> {
  toolName: string;      // 必須: TOOL_NAMEと一致させる
  message: string;       // 必須: LLMへの簡潔なステータス
  data?: T;              // UI専用データ（Viewコンポーネントで使用）
  jsonData?: J;          // LLMに見えるデータ（応答生成に使用）
  title?: string;        // 結果のタイトル（サイドバーに表示）
  instructions?: string; // LLMへの指示（「ユーザーに結果を説明して」など）
}
```

**重要な違い:**
- `data`: Viewコンポーネントでのみ使用。LLMには送信されない（大きなデータも可）
- `jsonData`: LLMに送信される。LLMがこのデータを見て応答を生成する

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
  _context: ToolContext,  // 今回は使わないので_をつける
  args: GreetingArgs,     // LLMが渡した引数
): Promise<ToolResult<GreetingData, never>> => {
  const { name, message } = args;

  // グリーティングデータを作成
  const greetingData: GreetingData = {
    name,
    message: message || `こんにちは、${name}さん！ようこそ！`,
    createdAt: new Date().toLocaleString("ja-JP"),
  };

  return {
    toolName: TOOL_NAME,  // 必須！definition.tsのTOOL_NAMEと一致
    message: `${name}さんへのグリーティングカードを作成しました`,  // LLMへの報告
    data: greetingData,   // Viewコンポーネント用
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

### pluginCoreの各パラメータ

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `toolDefinition` | ✅ | LLM用のツール定義（definition.tsからインポート） |
| `execute` | ✅ | ツール実行関数 |
| `generatingMessage` | | 実行中に表示するメッセージ |
| `isEnabled` | | ツールが有効かどうかを返す関数。`() => true`で常に有効 |
| `systemPrompt` | | LLMのシステムプロンプトに追加するテキスト |
| `samples` | | Quick Samplesに表示するテストデータ |

**よくある間違い:**
```typescript
// ❌ 間違い - toolNameがない
return {
  message: "完了しました",
  data: greetingData,
};

// ✅ 正しい - toolNameは必須
return {
  toolName: TOOL_NAME,  // これがないとViewに表示されない！
  message: "完了しました",
  data: greetingData,
};
```

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
yarn dev
```

1. Quick Samplesの「シンプルな挨拶」をクリック
2. グリーティングカードが表示される！
3. 他のサンプルも試してみる

## ステップ13: チャットでテストする

ステップ2.5で説明したMock Modeを使ってテストします：

1. `demo/shared/chat-utils.ts`にgreetingのモックレスポンスを追加（ステップ2.5参照）
2. デモ画面で「Mock Mode」がONになっていることを確認
3. チャットに「挨拶を作って」と入力
4. グリーティングカードが表示される！

Real API Modeでもテストしたい場合は、ステップ2.5の「Real API Modeに切り替え」を参照してください。

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
yarn typecheck
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
