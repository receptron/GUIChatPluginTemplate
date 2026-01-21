# CLAUDE.md

このファイルはClaude Code（claude.ai/code）がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

GUIChatPluginTemplateは、MulmoChat用のGUIプラグインを作成するためのテンプレートです。VueとReact両方に対応しています。

**現在のサンプル**: Quizプラグイン（複数選択問題を表示）

## 主要コマンド

```bash
yarn install      # 依存関係のインストール
yarn dev          # Vue版デモサーバー起動（http://localhost:5173）
yarn dev:react    # React版デモサーバー起動
yarn build        # ビルド（dist/に出力）
yarn typecheck    # 型チェック
yarn lint         # Lintチェック
```

---

## プラグイン作成の流れ

ユーザーから「〇〇プラグインを作って」と依頼されたら、以下の手順で作成します。

### 全体フロー

```
1. ユーザーの要件を確認
2. src/core/ のファイルを編集
3. src/vue/ のViewとPreviewを編集
4. demo/shared/chat-utils.ts にMockを追加
5. yarn dev でテスト
```

### 編集するファイル（順序重要）

**重要**: VueとReact両方のコンポーネントを同時に作成してください。

```
src/
├── core/
│   ├── definition.ts  ← ① ツール定義（LLMが見る）
│   ├── types.ts       ← ② TypeScript型定義
│   ├── plugin.ts      ← ③ execute関数（メインロジック）
│   ├── samples.ts     ← ④ Quick Samplesボタン用データ
│   └── index.ts       ← 通常編集不要
├── vue/
│   ├── View.vue       ← ⑤ メイン表示コンポーネント（Vue）
│   ├── Preview.vue    ← ⑥ サイドバーのサムネイル（Vue）
│   └── index.ts       ← 通常編集不要
└── react/
    ├── View.tsx       ← ⑦ メイン表示コンポーネント（React）
    ├── Preview.tsx    ← ⑧ サイドバーのサムネイル（React）
    └── index.ts       ← 通常編集不要
```

---

## 各ファイルの書き方

### ① definition.ts - ツール定義

LLMがこのツールをいつ使うか判断するための情報を定義します。

```typescript
import type { ToolDefinition } from "gui-chat-protocol";

// ツール名（名前空間:ツール名 の形式を推奨）
// 例: "receptron:quiz", "myorg:countdown", "username:greeting"
export const TOOL_NAME = "yournamespace:yourToolName";

// ツール定義（JSON Schema形式）
export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description: "このツールの説明（LLMがいつ使うか判断する）",
  parameters: {
    type: "object",
    properties: {
      // LLMから渡されるパラメータを定義
      title: {
        type: "string",
        description: "パラメータの説明",
      },
      items: {
        type: "array",
        items: { type: "string" },
        description: "配列の説明",
      },
    },
    required: ["title"],  // 必須パラメータ
  },
};
```

**ポイント**:
- `TOOL_NAME`は`名前空間:ツール名`の形式を推奨（例: `receptron:quiz`）
- 名前空間にはGitHubアカウント名や組織名を使用
- `description`はLLMが読んで理解できる説明を書く
- `parameters`はJSON Schema形式

### ② types.ts - 型定義

```typescript
// データ型（View/Previewで使用）
export interface YourData {
  title: string;
  items: string[];
}

// 引数型（definition.tsのparametersに対応）
export interface YourArgs {
  title: string;
  items?: string[];  // requiredでないものは?を付ける
}
```

**ポイント**:
- `YourArgs`はdefinition.tsの`parameters`と一致させる
- `YourData`はViewで表示するデータ構造

### ③ plugin.ts - execute関数

```typescript
import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";
import type { YourData, YourArgs } from "./types";
import { TOOL_NAME, TOOL_DEFINITION } from "./definition";
import { SAMPLES } from "./samples";

// execute関数 - LLMがツールを呼び出すと実行される
export const executeYourTool = async (
  _context: ToolContext,
  args: YourArgs,
): Promise<ToolResult<YourData, never>> => {
  const { title, items } = args;

  // データを作成
  const data: YourData = {
    title,
    items: items || [],
  };

  return {
    toolName: TOOL_NAME,  // 必須！TOOL_NAMEと一致させる
    message: `${title}を作成しました`,  // LLMへの報告
    data,  // View用データ（LLMには見えない）
    // jsonData: {...},  // LLMに見せたいデータがある場合
    instructions: "ユーザーに結果を確認するよう伝えてください",  // LLMへの指示
  };
};

// プラグインコア
export const pluginCore: ToolPluginCore<YourData, never, YourArgs> = {
  toolDefinition: TOOL_DEFINITION,
  execute: executeYourTool,
  generatingMessage: "作成中...",  // 実行中に表示するメッセージ
  isEnabled: () => true,
  samples: SAMPLES,
};
```

**ポイント**:
- `toolName`は必ず`TOOL_NAME`を使う（一致しないとViewが表示されない）
- `data`はView用、`jsonData`はLLM用
- `instructions`でLLMに次の応答の指示を出せる

### ④ samples.ts - テストデータ

```typescript
import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "サンプル1",  // Quick Samplesボタンの表示名
    args: {
      // YourArgsに対応するデータ
      title: "テストタイトル",
      items: ["アイテム1", "アイテム2"],
    },
  },
  {
    name: "サンプル2",
    args: {
      title: "別のテスト",
    },
  },
];
```

### ⑤ View.vue - メイン表示（Vue）

```vue
<template>
  <div class="size-full p-4 bg-white">
    <div v-if="data" class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">{{ data.title }}</h2>
      <ul class="space-y-2">
        <li v-for="(item, index) in data.items" :key="index" class="p-2 bg-gray-100 rounded">
          {{ item }}
        </li>
      </ul>
      <!-- ユーザーアクションがある場合 -->
      <button @click="handleAction" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        アクション
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { YourData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult;
  sendTextMessage: (text?: string) => void;  // チャットにメッセージ送信
}>();

const emit = defineEmits<{
  updateResult: [result: ToolResult];  // viewStateの更新
}>();

const data = ref<YourData | null>(null);

// 結果を監視してデータを更新
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.data) {
      data.value = newResult.data as YourData;
    }
  },
  { immediate: true }
);

// ユーザーアクション
function handleAction() {
  props.sendTextMessage("アクションを実行しました");
}
</script>
```

### ⑥ Preview.vue - サムネイル（Vue）

```vue
<template>
  <div class="p-3 bg-blue-50 rounded text-center">
    <div class="text-blue-600 font-medium">{{ title }}</div>
    <div class="text-xs text-gray-600 mt-1">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { YourData } from "../core/types";

const props = defineProps<{
  result: ToolResult;
}>();

const data = computed(() => props.result.data as YourData | null);
const title = computed(() => data.value?.title || "タイトル");
const subtitle = computed(() => `${data.value?.items?.length || 0}件`);
</script>
```

### ⑦ View.tsx - メイン表示（React）

```tsx
import { useState, useEffect, useCallback } from "react";
import type { ViewComponentProps } from "gui-chat-protocol";
import type { YourData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

type ViewProps = ViewComponentProps<YourData, never>;

export function View({ selectedResult, sendTextMessage, onUpdateResult }: ViewProps) {
  const [data, setData] = useState<YourData | null>(null);

  // 結果を監視してデータを更新
  useEffect(() => {
    if (selectedResult?.toolName === TOOL_NAME && selectedResult.data) {
      setData(selectedResult.data as YourData);
    }
  }, [selectedResult]);

  // ユーザーアクション
  const handleAction = () => {
    sendTextMessage("アクションを実行しました");
  };

  if (!data) {
    return null;
  }

  return (
    <div className="size-full p-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{data.title}</h2>
        <ul className="space-y-2">
          {data.items.map((item, index) => (
            <li key={index} className="p-2 bg-gray-100 rounded">
              {item}
            </li>
          ))}
        </ul>
        {/* ユーザーアクションがある場合 */}
        <button
          onClick={handleAction}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          アクション
        </button>
      </div>
    </div>
  );
}

export default View;
```

### ⑧ Preview.tsx - サムネイル（React）

```tsx
import type { PreviewComponentProps } from "gui-chat-protocol";
import type { YourData } from "../core/types";

type PreviewProps = PreviewComponentProps<YourData, never>;

export function Preview({ result }: PreviewProps) {
  const data = result.data as YourData | null;

  if (!data) {
    return null;
  }

  const title = data.title || "タイトル";
  const subtitle = `${data.items?.length || 0}件`;

  return (
    <div className="p-3 bg-blue-50 rounded text-center">
      <div className="text-blue-600 font-medium">{title}</div>
      <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
    </div>
  );
}

export default Preview;
```

**Vue vs Reactの違い**:

| 項目 | Vue | React |
|------|-----|-------|
| データ監視 | `watch(() => props.selectedResult, ...)` | `useEffect(() => {...}, [selectedResult])` |
| 状態 | `ref<T>(null)` | `useState<T>(null)` |
| Props型 | `defineProps<{...}>()` | `ViewComponentProps<T, J>` |
| viewState更新 | `emit("updateResult", {...})` | `onUpdateResult({...})` |
| クラス | `class="..."` | `className="..."` |
| 条件レンダリング | `v-if="data"` | `if (!data) return null;` |
| ループ | `v-for="(item, i) in items"` | `items.map((item, i) => ...)` |

---

## Mock Modeの設定

### demo/shared/chat-utils.ts を編集

```typescript
export const DEFAULT_MOCK_RESPONSES: Record<string, MockResponse> = {
  // 既存のquiz
  quiz: { /* ... */ },

  // 新しいプラグイン用のMockを追加
  yourTool: {
    toolCall: {
      name: "yourToolName",  // TOOL_NAMEと一致
      args: {
        // definition.tsのparametersに対応
        title: "テストタイトル",
        items: ["アイテム1", "アイテム2"],
      },
    },
  },

  // ...
};

export const findMockResponse = (
  userMessage: string,
  mockResponses: Record<string, MockResponse> = DEFAULT_MOCK_RESPONSES
): MockResponse => {
  const lowerMessage = userMessage.toLowerCase();

  // 既存
  if (lowerMessage.includes("quiz") || lowerMessage.includes("question")) {
    return mockResponses.quiz || DEFAULT_MOCK_RESPONSES.quiz;
  }

  // 新しいプラグイン用のキーワードを追加
  if (lowerMessage.includes("yourkeyword")) {
    return mockResponses.yourTool || DEFAULT_MOCK_RESPONSES.yourTool;
  }

  // ...
};
```

---

## 型パラメータの説明

```typescript
ToolResult<T, J>
ToolPluginCore<T, J, A>
```

| パラメータ | 説明 | 用途 |
|-----------|------|------|
| T | data型 | View/Preview用（LLMには見えない） |
| J | jsonData型 | LLMに見せるデータ（`never`なら不要） |
| A | args型 | LLMから渡される引数 |

**使い分け**:
- `data`: 大きなデータ、UI専用データ → T
- `jsonData`: LLMの次の応答に必要なデータ → J
- 両方使う場合: `ToolResult<ViewData, LLMData>`

---

## よくあるパターン

### パターン1: シンプルな表示のみ

```typescript
// plugin.ts
return {
  toolName: TOOL_NAME,
  message: "完了",
  data: { /* View用（LLMには見えない） */ },
};
```

### パターン2: LLMにデータを返す（jsonData）

LLMに現在の状態を見せて、次のアクションを判断させる場合に使用。

```typescript
// plugin.ts
return {
  toolName: TOOL_NAME,
  message: "クイズを表示しました",
  jsonData: {  // ← LLMがこれを見て次の応答を判断
    questions: [...],
    correctAnswers: [0, 2, 1],  // 正解データ
  },
  instructions: "ユーザーが回答したら、正解を確認してください",
};
```

### パターン3: ユーザー操作 → LLM処理 → 結果表示（クイズの回答検証）

**フロー:**
```
ユーザーが回答を選択
    ↓
View.vue: sendTextMessage("Q1: A, Q2: C, Q3: B")
    ↓
LLM: jsonDataの正解と比較して採点
    ↓
LLM: "正解は2問です！Q2が間違いでした"
```

**View.vue:**
```vue
<script setup lang="ts">
function handleSubmit() {
  // ユーザーの回答をテキストでLLMに送信
  const answerText = userAnswers.value
    .map((answer, index) => {
      const letter = String.fromCharCode(65 + answer); // A, B, C...
      return `Q${index + 1}: ${letter}`;
    })
    .join(", ");

  props.sendTextMessage(`回答: ${answerText}`);
}
</script>
```

**plugin.ts:**
```typescript
return {
  toolName: TOOL_NAME,
  message: `クイズを表示しました（${questions.length}問）`,
  jsonData: {
    questions,
    correctAnswers: questions.map(q => q.correctAnswer),
  },
  // LLMへの指示: ユーザーの回答を検証するよう促す
  instructions: "ユーザーが回答を送信したら、jsonDataのcorrectAnswersと比較して採点してください。",
};
```

### パターン4: ゲーム（ユーザー vs LLM）- オセロの例

**フロー:**
```
1. ユーザー: "オセロしよう"
    ↓
2. LLM: execute({ action: "new_game" })
    ↓
3. plugin.ts: 初期盤面を作成、jsonDataで返す
    ↓
4. View: 盤面を表示、ユーザーがクリック
    ↓
5. View: sendTextMessage("A3に置きます")
    ↓
6. LLM: execute({ action: "move", row: 2, col: 0, board: [...] })
    ↓
7. plugin.ts: ユーザーの手を処理、次はLLMの番
    ↓
8. instructions: "あなたの番です。次の手を選んでください"
    ↓
9. LLM: execute({ action: "move", row: 4, col: 5, ... })
    ↓
（4に戻って繰り返し）
```

**definition.ts:**
```typescript
export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description: "オセロをプレイする",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["new_game", "move", "pass"],
        description: "アクション: 新規ゲーム、手を打つ、パス",
      },
      row: {
        type: "number",
        description: "行（0-7）",
      },
      col: {
        type: "number",
        description: "列（0-7）",
      },
      board: {
        type: "array",
        description: "現在の盤面（8x8）。変更せずそのまま渡す",
        items: { type: "array", items: { type: "string", enum: [".", "B", "W"] } },
      },
      currentSide: {
        type: "string",
        enum: ["B", "W"],
        description: "現在のプレイヤー",
      },
    },
    required: ["action"],
  },
};
```

**plugin.ts:**
```typescript
export const executeOthello = async (
  _context: ToolContext,
  args: OthelloArgs,
): Promise<ToolResult<never, OthelloState>> => {
  let state: OthelloState;

  if (args.action === "new_game") {
    state = createNewGame();
  } else if (args.action === "move") {
    state = makeMove(args.board, args.row, args.col, args.currentSide);
  }

  // 次がLLMの番かどうか判定
  const isComputerTurn = state.playerNames[state.currentSide] === "computer";

  // instructionsでLLMの次のアクションを指示
  const instructions = state.isTerminal
    ? "ゲーム終了です。結果を伝えてください。"
    : isComputerTurn
      ? "あなたの番です。jsonDataのlegalMovesから手を選んでください。"
      : "ユーザーの番です。手を待ってください。";

  return {
    toolName: TOOL_NAME,
    message: `(${args.row}, ${args.col})に置きました`,
    jsonData: state,  // ← LLMが盤面と合法手を見れる
    instructions,
    instructionsRequired: isComputerTurn,  // LLMの番なら必ず送信
    updating: args.action !== "new_game",  // 既存結果を更新
  };
};
```

**View.vue:**
```vue
<script setup lang="ts">
const isComputerTurn = computed(() => {
  return gameState.value?.playerNames[gameState.value.currentSide] === "computer";
});

function handleCellClick(row: number, col: number) {
  // LLMの番なら無視
  if (isComputerTurn.value) return;

  const columnLetter = String.fromCharCode(65 + col); // A-H
  const rowNumber = row + 1; // 1-8

  props.sendTextMessage(`${columnLetter}${rowNumber}に置きます（row=${row}, col=${col}）`);
}
</script>
```

### パターン5: 状態の永続化（viewState）

```vue
// View.vue
watch(
  selectedAnswer,
  (newAnswer) => {
    emit("updateResult", {
      ...props.selectedResult,
      viewState: { selectedAnswer: newAnswer },
    });
  }
);

// 復元
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.viewState?.selectedAnswer) {
      selectedAnswer.value = newResult.viewState.selectedAnswer;
    }
  },
  { immediate: true }
);
```

---

## ToolResult の重要なフィールド

```typescript
interface ToolResult<T, J> {
  toolName: string;       // 必須: TOOL_NAMEと一致
  message: string;        // LLMへの簡潔な報告

  // データ
  data?: T;               // View専用（LLMには見えない、大きなデータOK）
  jsonData?: J;           // LLMに見せるデータ（構造化データ）

  // LLMへの指示
  instructions?: string;  // 次のアクションの指示
  instructionsRequired?: boolean;  // trueならユーザー設定に関わらず送信

  // 結果の更新
  updating?: boolean;     // trueなら既存結果を更新（新規追加しない）

  // UI
  title?: string;         // サイドバーのタイトル
}
```

**使い分け:**

| フィールド | 用途 | 例 |
|-----------|------|-----|
| `data` | View専用の大きなデータ | 画像データ、詳細なUI情報 |
| `jsonData` | LLMに見せたいデータ | ゲーム状態、正解データ、選択肢 |
| `instructions` | LLMへの次のアクション指示 | "回答を検証して" "次の手を選んで" |
| `instructionsRequired` | 強制的に指示を送信 | ゲームでLLMの番のとき |
| `updating` | 既存結果を更新 | ゲームの手を打つとき |

---

## チェックリスト

プラグイン作成後、以下を確認：

**Core（必須）**:
- [ ] `TOOL_NAME`が`名前空間:ツール名`形式（例: `receptron:quiz`）
- [ ] `definition.ts`の`parameters`と`types.ts`の`Args`が一致
- [ ] `plugin.ts`の`return`に`toolName: TOOL_NAME`がある
- [ ] `samples.ts`の`args`が`Args`型に一致

**Vue**:
- [ ] `View.vue`で`toolName === TOOL_NAME`でフィルタリング
- [ ] `Preview.vue`が正しくデータを表示

**React**:
- [ ] `View.tsx`で`toolName === TOOL_NAME`でフィルタリング
- [ ] `Preview.tsx`が正しくデータを表示
- [ ] `export default View;`と`export default Preview;`がある

**テスト**:
- [ ] `demo/shared/chat-utils.ts`にMockを追加
- [ ] `yarn typecheck`が通る
- [ ] `yarn lint`が通る
- [ ] `yarn dev`でQuick Samplesが動作する（Vue）
- [ ] `yarn dev:react`でQuick Samplesが動作する（React）

---

## トラブルシューティング

### Viewが表示されない
- `toolName`が`TOOL_NAME`と一致しているか確認
- `View.vue`で`toolName === TOOL_NAME`のフィルタリングがあるか確認

### 型エラーが出る
- `types.ts`の型が`definition.ts`のparametersと一致しているか確認
- `yarn typecheck`で詳細を確認

### Mock Modeで動かない
- `demo/shared/chat-utils.ts`にMockとキーワードを追加したか確認
- キーワードが正しくマッチするか確認

---

## 参考ドキュメント

- [はじめに](./docs/getting-started.ja.md) - 初心者向けチュートリアル
- [高度な機能](./docs/advanced-features.ja.md) - sendTextMessage、viewState、Tailwind CSS
- [npm公開ガイド](./docs/npm-publishing-guide.md) - パッケージ公開
