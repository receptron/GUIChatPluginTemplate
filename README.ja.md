# GUIChat プラグインテンプレート

**チャットデモ環境統合**を備えたGUIChat/MulmoChat用プラグインテンプレート。

このテンプレートは、ジュニアエンジニアがプラグインとLLMの連携を実際のチャットインターフェースで確認しながらプラグイン開発を学べるように設計されています。

> **Note**: このテンプレートには**Quizプラグインが動作サンプル**として含まれています。Quizプラグインは、ユーザー入力を受け付けるインタラクティブなプラグインの作成方法を示しています。自分のプラグイン実装に置き換えてください。

## 特徴

- **チャット統合デモ**: 実際のチャットインターフェースでプラグインをテスト
- **Mockモード**: APIキー不要で開発
- **Real APIモード**: 本番環境に近いOpenAI APIでテスト
- **フレームワーク非依存のCore**: プラグインロジックをUIフレームワークから分離
- **Vue + React対応**: 両フレームワークをすぐに使用可能
- **TypeScript**: 完全な型安全性
- **Tailwind CSS 4**: モダンなスタイリング

## クイックスタート

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev        # Vueデモ
npm run dev:react  # Reactデモ
```

http://localhost:5173 を開いてデモを確認。

### デモ機能

1. **チャットパネル**: メッセージを送信してLLMの応答を確認
2. **Mockモード**: APIキー不要でテスト（「quiz」「hello」キーワードを認識）
3. **Real APIモード**: OpenAI APIキーで実際のLLM連携
4. **Viewコンポーネント**: プラグインの結果表示を確認
5. **Previewコンポーネント**: サイドバーサムネイルを確認
6. **Quick Samples**: プラグインサンプルを直接実行

## 独自プラグインの作成

### ステップ1: テンプレートをコピー

```bash
cp -r GUIChatPluginTemplate GUIChatPluginMyPlugin
cd GUIChatPluginMyPlugin
```

### ステップ2: package.jsonを更新

パッケージ名を変更:
```json
{
  "name": "@gui-chat-plugin/my-plugin",
  "description": "プラグインの説明"
}
```

### ステップ3: プラグインを実装

`src/core/`のファイルを編集:

1. **types.ts** - データ型を定義
2. **definition.ts** - ツール名とJSONスキーマを定義
3. **samples.ts** - テストデータを追加
4. **plugin.ts** - execute関数を実装

`src/vue/`のファイルを編集:

1. **View.vue** - メインUIコンポーネント
2. **Preview.vue** - サイドバーサムネイル

### ステップ4: モックレスポンスを更新（オプション）

`demo/shared/chat-utils.ts`を編集してプラグイン用のモックレスポンスを追加:

```typescript
export const DEFAULT_MOCK_RESPONSES: Record<string, MockResponse> = {
  // プラグインのモックレスポンスを追加
  myKeyword: {
    toolCall: {
      name: "myToolName",
      args: { /* 引数 */ },
    },
  },
  // ...
};
```

## プラグイン構造

```
GUIChatPluginTemplate/
├── src/
│   ├── index.ts          # デフォルトエクスポート（core）
│   ├── style.css         # Tailwind CSSエントリー
│   ├── core/             # フレームワーク非依存（Vue/React依存なし）
│   │   ├── index.ts      # Coreエクスポート
│   │   ├── types.ts      # プラグイン固有の型
│   │   ├── definition.ts # ツール定義（LLM用スキーマ）
│   │   ├── samples.ts    # テスト用サンプルデータ
│   │   └── plugin.ts     # Execute関数
│   ├── vue/              # Vue固有の実装
│   │   ├── index.ts      # Vueプラグイン（core + コンポーネント）
│   │   ├── View.vue      # メインビューコンポーネント
│   │   └── Preview.vue   # サイドバープレビュー
│   └── react/            # React固有の実装
│       ├── index.ts      # Reactプラグイン（core + コンポーネント）
│       ├── View.tsx      # メインビューコンポーネント
│       └── Preview.tsx   # サイドバープレビュー
└── demo/                 # チャット統合デモ
    ├── vue/              # Vueデモ
    │   ├── App.vue       # チャットUI付きデモアプリ
    │   ├── useChat.ts    # チャットコンポーザブル
    │   └── main.ts       # エントリーポイント
    ├── react/            # Reactデモ
    │   ├── App.tsx       # チャットUI付きデモアプリ
    │   ├── useChat.ts    # チャットフック
    │   └── main.tsx      # エントリーポイント
    └── shared/           # 共有ユーティリティ
        ├── chat-types.ts # チャットメッセージ型
        └── chat-utils.ts # OpenAI連携
```

## チャットフローの理解

```
ユーザー入力
    ↓
useChat.sendMessage()
    ↓
┌─────────────────────────────────────┐
│  Mockモード?                        │
│  ├─ Yes → モックレスポンスを返す    │
│  └─ No  → OpenAI APIを呼び出す      │
└─────────────────────────────────────┘
    ↓
LLMレスポンス（tool_callsを含む場合あり）
    ↓
┌─────────────────────────────────────┐
│  tool_callsあり?                    │
│  ├─ Yes → plugin.execute(args)      │
│  │        → 結果を更新              │
│  │        → Viewコンポーネントに表示 │
│  │        → APIを再呼び出し          │
│  │        → LLMの応答を取得          │
│  └─ No  → テキストレスポンスを表示   │
└─────────────────────────────────────┘
```

## 重要な概念

### ToolResult

execute関数は`ToolResult`を返します:

```typescript
interface ToolResult<T, J> {
  toolName: string;      // TOOL_NAMEと一致必須（必須）
  message: string;       // LLM向けの簡潔なステータス
  jsonData?: J;          // LLMに見えるデータ
  data?: T;              // UI専用データ（LLMには送信されない）
  title?: string;        // 結果のタイトル
  instructions?: string; // LLMへのフォローアップ指示
}
```

### Viewコンポーネントのprops

```typescript
// View.vueが受け取るprops
{
  selectedResult: ToolResult;              // 表示する現在の結果
  sendTextMessage: (text: string) => void; // チャットにメッセージを送信
}

// 発行するイベント
@updateResult="(updated: ToolResult) => void"
```

### 重要なパターン: ref + watch

View.vueでは、`computed`の代わりに`ref + watch`パターンを使用:

```typescript
// ✅ 正しい
const data = ref<MyData | null>(null);
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.jsonData) {
      data.value = newResult.jsonData;
    }
  },
  { immediate: true }
);

// ❌ 間違い - リアクティビティの問題が発生
const data = computed(() => props.selectedResult?.jsonData);
```

## コマンド

```bash
npm run dev          # Vueデモを起動
npm run dev:react    # Reactデモを起動
npm run build        # 本番用ビルド
npm run typecheck    # 型チェック
npm run lint         # コードのLint
```

## MulmoChatとの統合

プラグイン開発後:

1. npmに公開またはローカルパスを使用
2. MulmoChatにインストール:
   ```bash
   npm add @gui-chat-plugin/my-plugin
   ```
3. MulmoChatの`src/tools/index.ts`でインポート:
   ```typescript
   import MyPlugin from "@gui-chat-plugin/my-plugin/vue";
   ```

## ドキュメント

詳細なドキュメントは[docs/](./docs/)を参照:

- [はじめに](./docs/getting-started.ja.md) - 初心者向けチュートリアル
- [プラグイン開発ガイド](./docs/plugin-development-guide.md) - 詳細リファレンス
- [AI開発ガイド](./docs/ai-development-guide.md) - AI向け最適化ガイド
- [npm公開ガイド](./docs/npm-publishing-guide.md) - 公開と統合

## ライセンス

MIT
