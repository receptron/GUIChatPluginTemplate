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

## 全体像：プラグインの仕組み

プラグイン開発を始める前に、全体の流れを理解しましょう。

### プラグインが動作する仕組み

```
┌─────────────────────────────────────────────────────────────────┐
│ ユーザー: 「田中さんへの挨拶カードを作って」                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LLM: 「greetingCardツールを使おう」                              │
│      definition.ts の情報を見て判断                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ execute関数が呼ばれる (plugin.ts)                                │
│   - args: { name: "田中" } を受け取る                            │
│   - ToolResult を返す                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 画面に表示                                                       │
│   - View.vue: メインの表示（グリーティングカード）                │
│   - Preview.vue: サイドバーのサムネイル                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LLM: 「田中さんへのグリーティングカードを作成しました！」          │
│      ToolResult.message と instructions を見て応答               │
└─────────────────────────────────────────────────────────────────┘
```

### ファイル間の依存関係

```
definition.ts ─────┐
   │               │
   │ TOOL_NAME     │ TOOL_DEFINITION
   ↓               ↓
types.ts ──────→ plugin.ts ──────→ samples.ts
   │               │
   │ 型定義        │ execute, pluginCore
   ↓               ↓
View.vue ←─────────┘
Preview.vue
```

**依存の流れ:**
1. `definition.ts`: ツール名とパラメータを定義（最初に作る）
2. `types.ts`: データの型を定義（definition.tsのパラメータに合わせる）
3. `plugin.ts`: 実行ロジック（types.tsの型を使う）
4. `samples.ts`: テストデータ（types.tsの型に合わせる）
5. `View.vue/Preview.vue`: UI（types.tsの型を使ってデータを表示）

---

## ステップ1: プロジェクトのセットアップ

**このステップの目的:** 開発環境を準備する

**影響:** すべての後続ステップの基盤

```bash
# テンプレートをクローン
git clone https://github.com/receptron/GUIChatPluginTemplate.git GUIChatPluginGreeting
cd GUIChatPluginGreeting

# 依存関係をインストール
yarn install
```

> **なぜクローンするの？**
> テンプレートには、プラグイン開発に必要なすべての設定（TypeScript、Vite、Tailwind CSS）が含まれています。
> ゼロから作るより、このテンプレートを元に変更する方がはるかに簡単です。

## ステップ2: デモを実行

**このステップの目的:** テンプレートが正しく動作することを確認する

**依存:** ステップ1（yarn installが完了していること）

```bash
yarn dev
```

http://localhost:5173 を開きます。Quizデモが動作しているはずです。

**試してみよう：**
1. Quick Samplesセクションの「Simple Quiz」ボタンをクリック
2. Quiz Viewが表示される
3. 質問に答える

> **なぜデモを試すの？**
> 自分のプラグインを作る前に、既存のQuizプラグインで「プラグインがどう動くか」を体験します。
> これが後で作るプラグインの完成形のイメージになります。

## ステップ2.5: Mock Modeを理解する（重要）

### Mock Modeとは？

Mock Modeは**実際のLLMを使わずに、LLMの動作を模倣する**モードです。

```
Real API Mode:  ユーザー入力 → OpenAI API → 数秒待つ → LLMが判断 → ツール呼び出し
Mock Mode:      ユーザー入力 → キーワード判定 → 即座に → ツール呼び出し
```

**Mock Modeのメリット:**
- APIキー不要（無料で開発できる）
- レスポンスが即座に返る（待ち時間なし）
- API料金がかからない
- オフラインでも動作する

**最初の開発はMock Modeで行い、動作確認ができたらReal API Modeでテストする**のがおすすめです。

デモには2つのモードがあります：

| モード | APIキー | 用途 |
|--------|---------|------|
| **Mock Mode** | 不要 | 開発・テスト用。キーワードで疑似的にLLM応答を即座に返す |
| **Real API Mode** | 必要 | 本番テスト用。実際のOpenAI APIを使用（数秒かかる） |

### Mock Modeの仕組み

```
ユーザーが入力 → キーワードをチェック → マッチしたらツール呼び出し
```

例：ユーザーが「quiz を作って」と入力
1. メッセージに「quiz」が含まれているかチェック
2. 含まれていれば、`putQuestions`ツールを呼び出すモックレスポンスを返す
3. プラグインが実行され、Viewに表示される

### テンプレートに最初から設定されているキーワード

Mock Modeでは、入力メッセージに特定のキーワードが含まれているかをチェックして、対応するレスポンスを返します。

テンプレートには、Quizプラグイン用のキーワードが最初から設定されています（`demo/shared/chat-utils.ts`）：

| 入力に含まれる単語 | Mock Modeの動作 |
|-------------------|----------------|
| `quiz` または `question` | Quizプラグインのツールを呼び出す |
| `hello` または `hi` | テキストで挨拶を返す |
| 上記以外 | 汎用的なテキスト応答を返す |

**例：**
- 「quizを作って」と入力 → `quiz`を検出 → Quizプラグインが動作
- 「hello」と入力 → `hello`を検出 → 「Hello! How can I help you?」と返答
- 「天気を教えて」と入力 → 該当なし → 汎用応答

### 自分のプラグイン用にMockを追加する

**これが重要！** 新しいプラグインを作ったら、Mock Modeでテストするためにモックレスポンスを追加します。

### モックレスポンスとは何を設定するのか？

モックレスポンスは**「LLMがツールを呼び出すときに渡す引数」を模倣するデータ**です。

つまり、`definition.ts`で定義したパラメータに基づいて、LLMが生成するはずの引数を自分で設定します。

```
あなたが definition.ts で定義:           LLMが理解する内容:
parameters: {                           「このツールには name と message を渡せばいい」
  name: { type: "string" },      →
  message: { type: "string" }
}

本番環境（Real API Mode）:               Mock Mode:
ユーザー: 「田中さんへの挨拶」            ユーザー: 「挨拶を作って」
    ↓                                        ↓
LLMが判断して引数を生成:                  あなたが設定した引数を使う:
{ name: "田中", message: "..." }         { name: "田中", message: "..." }
    ↓                                        ↓
execute() が呼ばれる                     execute() が呼ばれる（同じ）
```

**つまり、モックレスポンスの`args`は、definition.tsの`parameters`に対応した値を設定します。**

### 設定方法

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
        // ⚠️ definition.ts の parameters で定義した項目を設定
        // LLMが生成するであろう値を自分で書く
        name: "田中",         // parameters.name に対応
        message: "こんにちは！", // parameters.message に対応
      },
    },
  },

  // ...
};
```

### definition.ts との対応関係

```typescript
// definition.ts で定義したパラメータ:
parameters: {
  properties: {
    name: { type: "string", description: "挨拶する相手の名前" },
    message: { type: "string", description: "カスタムメッセージ" },
  },
  required: ["name"],
}

// ↓ 対応するモックレスポンスの args:
args: {
  name: "田中",         // ← definition.ts の name に対応
  message: "こんにちは！", // ← definition.ts の message に対応
}
```

> **なぜこうするの？**
> Mock Modeでは、LLMの代わりにあなたが「このツールにはこの引数を渡す」と決めます。
> これにより、LLM（API）を使わなくても、プラグインの動作をテストできます。

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

**このステップの目的:** 何をどこに書くか把握する

**依存:** なし（知識のステップ）

変更を加える前に、各ファイルの役割を理解しましょう：

```
src/
├── core/                    # プラグインロジック（UIなし）
│   ├── definition.ts        # ① ツール名とパラメータ（LLMが見る）
│   ├── types.ts            # ② TypeScript型（全ファイルで使う）
│   ├── plugin.ts           # ③ メインのexecute関数
│   └── samples.ts          # ④ テストデータ
└── vue/                     # Vue UIコンポーネント
    ├── View.vue            # ⑤ メイン表示
    └── Preview.vue         # ⑥ サムネイル
```

> **編集する順番が重要！**
> 上の番号順に編集することで、依存関係のエラーを避けられます。
> 例：types.tsを先に作らないと、plugin.tsで型エラーが出ます。

---

## ステップ4: ツールを定義する (definition.ts)

**このステップの目的:** LLMに「このツールは何ができるか」を伝える

**影響:**
- LLMがこのツールをいつ使うか判断する材料になる
- `parameters`で定義した項目が、execute関数の`args`に渡される

**依存:** なし（最初に作成するファイル）

### なぜこのファイルが重要？

```
ユーザー: 「田中さんへの挨拶カードを作って」
                    ↓
LLM: definition.tsの description を読む
     「カスタムメッセージ付きのパーソナライズされたグリーティングカードを作成」
     → このツールが適切だと判断
                    ↓
LLM: parameters を見て引数を組み立てる
     { name: "田中" }
```

`src/core/definition.ts` を編集：

```typescript
import type { ToolDefinition } from "gui-chat-protocol";

// ツール名（結果の識別に使用）
// ⚠️ 重要: この名前はプロジェクト内で一意。execute()の戻り値でも使う
export const TOOL_NAME = "greetingCard";

// LLM向けのツール定義
export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  // ⚠️ description: LLMはこれを読んでツールを使うか判断する
  description: "カスタムメッセージ付きのパーソナライズされたグリーティングカードを作成",
  parameters: {
    type: "object",
    properties: {
      // ⚠️ ここで定義したパラメータが execute(context, args) の args に入る
      name: {
        type: "string",
        description: "挨拶する相手の名前",  // LLMがこれを見て値を決める
      },
      message: {
        type: "string",
        description: "オプションのカスタムメッセージ",
      },
    },
    required: ["name"],  // 必須パラメータ
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

**このステップの目的:** TypeScriptの型を定義し、コード全体で一貫性を保つ

**影響:**
- `plugin.ts`: execute関数の引数と戻り値の型
- `View.vue/Preview.vue`: 表示するデータの型
- `samples.ts`: テストデータの型

**依存:** ステップ4（definition.tsのparametersに合わせる）

### なぜ型定義が必要？

```
definition.ts で定義:         types.ts で型定義:
parameters: {                 interface GreetingArgs {
  name: string,         →       name: string;
  message?: string              message?: string;
}                             }
```

definition.tsの`parameters`と types.tsの`Args`は対応している必要があります。

`src/core/types.ts` を編集：

```typescript
/**
 * View/Previewコンポーネント用のデータ
 * execute()が返すToolResult.dataの型
 */
export interface GreetingData {
  name: string;
  message: string;
  createdAt: string;
}

/**
 * execute関数に渡される引数
 * ⚠️ definition.ts の parameters と一致させる
 */
export interface GreetingArgs {
  name: string;       // required: ["name"] なので必須
  message?: string;   // required に含まれないのでオプション（?をつける）
}
```

> **型が一致しないとどうなる？**
> - TypeScriptエラーが出る
> - 実行時にデータが正しく渡らない
> - Viewコンポーネントで表示エラーになる

---

## ステップ6: Execute関数を実装する (plugin.ts)

**このステップの目的:** ツールが呼ばれたときに実行される処理を書く

**影響:**
- 戻り値の`data`が View.vue に渡される
- 戻り値の`message`と`instructions`が LLM に送られる

**依存:**
- ステップ4: `TOOL_NAME`を使う
- ステップ5: `GreetingData`, `GreetingArgs`の型を使う

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

**このステップの目的:** Quick Samplesボタンで使うテストデータを定義する

**影響:** デモ画面の「Quick Samples」セクションにボタンが表示される

**依存:** ステップ5（GreetingArgsの型に合わせる）

### サンプルとは？

> **重要:** samples.tsは**このデモ環境でのみ使用**されます。
> MulmoChatなどの本番アプリでは使用されません。

サンプルは「LLMがツールを呼び出すときに渡す引数」をエミュレートするデータです。

```
本番環境（MulmoChat）:
  ユーザー: 「田中さんへの挨拶を作って」
      ↓
  LLM: greetingCardツールを呼び出す
      ↓
  execute({ name: "田中" })  ← LLMが引数を決める

デモ環境（このテンプレート）:
  Quick Samplesボタンをクリック
      ↓
  execute({ name: "田中" })  ← samples.tsの引数を使う
```

つまり、**LLMなしでプラグインの動作をテストできる**仕組みです。

```
デモ画面の Quick Samples:
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ シンプルな挨拶  │ │カスタムメッセージ│ │ ようこそカード  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
        ↓ クリック
execute({ name: "田中" }) が呼ばれる（LLMを経由せずに直接実行）
```

`src/core/samples.ts` を編集：

```typescript
import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "シンプルな挨拶",  // ボタンに表示される名前
    args: {
      // ⚠️ GreetingArgs型と一致させる
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

> **サンプルが動かない？**
> `args`の内容が`GreetingArgs`型と一致しているか確認してください。

---

## ステップ8: Viewコンポーネントを作成する (Vue)

**このステップの目的:** プラグインのメインUIを作成する

**影響:** execute()の結果がここに表示される

**依存:**
- ステップ4: `TOOL_NAME`を使って結果をフィルタリング
- ステップ5: `GreetingData`型でデータを受け取る
- ステップ6: `execute()`が返した`data`を受け取る

### Viewコンポーネントのデータフロー

```
execute()が返す:                View.vueが受け取る:
{                               props.selectedResult
  toolName: "greetingCard",       │
  data: {                         ↓
    name: "田中",         →    greetingData = {
    message: "...",              name: "田中",
    createdAt: "..."             message: "...",
  }                              createdAt: "..."
}                              }
```

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

**このステップの目的:** サイドバーに表示する小さなサムネイルを作成する

**影響:** サイドバーの結果一覧に表示される

**依存:** ステップ5（GreetingData型を使用）

### Previewとは？

```
┌──────────────────────────────────────────────────────────┐
│ サイドバー                   │        メイン画面          │
│ ┌─────────────┐              │                           │
│ │ 🎉          │ ← Preview    │   ┌───────────────────┐   │
│ │ 田中        │              │   │                   │   │
│ └─────────────┘              │   │   View.vue        │   │
│ ┌─────────────┐              │   │   の内容          │   │
│ │ 🎉          │              │   │                   │   │
│ │ 佐藤        │              │   └───────────────────┘   │
│ └─────────────┘              │                           │
└──────────────────────────────────────────────────────────┘
```

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
  result: ToolResult<GreetingData>;  // execute()の戻り値全体が渡される
}>();
</script>
```

> **Previewはシンプルに！**
> サムネイルなので、必要最小限の情報だけ表示します。

---

## ステップ10: エクスポートを更新する

**このステップの目的:** 作成したモジュールを外部から使えるようにする

**影響:** npm公開時に他のプロジェクトからインポートできるようになる

**依存:** ステップ4〜9のすべて（各モジュールをまとめる）

### なぜエクスポートが必要？

```
MulmoChatから使う場合:
import Plugin from "@gui-chat-plugin/greeting/vue";
                                      ↑
                            src/vue/index.ts のエクスポート
```

🚫 **このファイルは基本的に編集不要です。** テンプレートのまま使えます。

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

---

## ステップ11: package.jsonを更新する

**このステップの目的:** パッケージ名を設定する

**影響:** npm公開時のパッケージ名になる

**依存:** なし

`package.json` を編集：

```json
{
  "name": "@gui-chat-plugin/greeting",
  "description": "GUIChat用のグリーティングカードプラグイン"
}
```

> **命名規則**
> `@gui-chat-plugin/` で始めると、他のGUIChatプラグインと統一感が出ます。

---

## ステップ12: プラグインをテストする

**このステップの目的:** Quick Samplesで動作確認する

**依存:** ステップ1〜10がすべて完了していること

```bash
yarn dev
```

1. Quick Samplesの「シンプルな挨拶」をクリック
2. グリーティングカードが表示される！
3. 他のサンプルも試してみる

## ステップ13: チャットでテストする

**このステップの目的:** 実際のチャット風の操作でテストする

**依存:**
- ステップ12が成功していること
- ステップ2.5でMock Modeを理解していること

### Quick Samplesとの違い

```
Quick Samples:     ボタンクリック → 即座にexecute()実行
Mock Mode Chat:    テキスト入力 → キーワードマッチ → execute()実行
Real API Mode:     テキスト入力 → LLMが判断 → execute()実行
```

ステップ2.5で説明したMock Modeを使ってテストします：

1. `demo/shared/chat-utils.ts`にgreetingのモックレスポンスを追加（ステップ2.5参照）
2. デモ画面で「Mock Mode」がONになっていることを確認
3. チャットに「挨拶を作って」と入力
4. グリーティングカードが表示される！

Real API Modeでもテストしたい場合は、ステップ2.5の「Real API Modeに切り替え」を参照してください。

---

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

### Lintエラー

コードスタイルの問題を確認：
```bash
yarn lint
```

ESLintがコードの問題点を指摘します。表示されたエラーや警告を修正してください。

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
