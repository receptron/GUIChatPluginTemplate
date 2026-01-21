# GUIChat プラグインテンプレート ドキュメント

このテンプレートは、VueとReact両方に対応したGUIChat/MulmoChatプラグインを作成するために必要なすべてを提供します。

> **Note**: このテンプレートには**Quizプラグインが動作サンプル**として含まれています。Quizプラグインは、ユーザー入力を受け付けるインタラクティブなプラグインの作成方法を示しています。自分のプラグイン実装に置き換えてください。

## 対象読者

- **初心者**: プラグイン開発が初めて? → [はじめに](./getting-started.ja.md)
- **AIアシスタント**: Claude/GPTで開発? → [AI開発ガイド](./ai-development-guide.md)
- **経験者**: → [プラグイン開発ガイド](./plugin-development-guide.md)

## ドキュメント一覧

| ドキュメント | 説明 | 対象 |
|-------------|------|------|
| [はじめに](./getting-started.ja.md) | 初めてのプラグインを作るチュートリアル | 初心者 |
| [プラグイン開発ガイド](./plugin-development-guide.md) | 開発リファレンス（詳細） | 全開発者 |
| [AI開発ガイド](./ai-development-guide.md) | AI向けに最適化された手順書 | AI + 開発者 |
| [npm公開ガイド](./npm-publishing-guide.md) | npmへの公開とMulmoChatでの使用 | 全開発者 |

## クイックスタート（5分）

### 1. クローンとセットアップ

```bash
# テンプレートをクローン
git clone https://github.com/receptron/GUIChatPluginTemplate.git GUIChatPluginMyPlugin
cd GUIChatPluginMyPlugin

# 依存関係をインストール
npm install

# デモを実行
npm run dev        # Vueデモ
npm run dev:react  # Reactデモ
```

### 2. デモを試す

ブラウザで http://localhost:5173 を開きます：
- 左側: チャットインターフェース
- 右側: プラグインのView/Preview
- サンプルボタンでプラグインをテスト

### 3. カスタマイズ

以下のファイルを編集してプラグインを作成：
- `src/core/definition.ts` - ツール名とスキーマ
- `src/core/plugin.ts` - execute関数
- `src/vue/View.vue` または `src/react/View.tsx` - UIコンポーネント

## テンプレート構造

```
GUIChatPluginTemplate/
├── src/
│   ├── core/           # フレームワーク非依存のロジック
│   │   ├── definition.ts  # ツールスキーマ（名前、パラメータ）
│   │   ├── plugin.ts      # execute関数
│   │   ├── types.ts       # TypeScript型定義
│   │   └── samples.ts     # テストサンプル
│   ├── vue/            # Vueコンポーネント
│   │   ├── View.vue       # メイン表示
│   │   └── Preview.vue    # サムネイル
│   └── react/          # Reactコンポーネント
│       ├── View.tsx       # メイン表示
│       └── Preview.tsx    # サムネイル
├── demo/
│   ├── vue/            # チャット付きVueデモ
│   ├── react/          # チャット付きReactデモ
│   └── shared/         # 共有チャットユーティリティ
└── docs/               # このドキュメント
```

## 重要な概念

### プラグインとは？

プラグインは、LLMがアクションを実行して結果を表示するためのツールです：

```
ユーザー: 「JavaScriptのクイズを見せて」
    ↓
LLMが"quiz"ツールの使用を決定
    ↓
プラグインのexecute()関数が実行
    ↓
結果がViewコンポーネントに表示
```

### 主要コンポーネント

1. **Tool Definition** (`definition.ts`)
   - LLMにツールの機能を伝える
   - ツールが受け取るパラメータを定義

2. **Execute関数** (`plugin.ts`)
   - LLMがツールを呼び出すと実行される
   - 表示用のデータを返す

3. **Viewコンポーネント** (`View.vue` / `View.tsx`)
   - 結果を表示
   - ユーザーインタラクションを処理

4. **Previewコンポーネント** (`Preview.vue` / `Preview.tsx`)
   - サイドバーに表示されるサムネイル

## デモチャット機能

このテンプレートにはテスト用のチャットデモが含まれています：

- **Mockモード**: APIキー不要でテスト（パターンベースの応答）
- **Real APIモード**: OpenAIに接続して実際のLLM対話

Real APIモードを使用するには：
```bash
# .envファイルを作成
echo "VITE_OPENAI_API_KEY=your-api-key-here" > .env
```

## 次のステップ

1. **初心者**: [はじめに](./getting-started.ja.md)でハンズオンチュートリアル
2. **プラグイン作成**: [プラグイン開発ガイド](./plugin-development-guide.md)に従う
3. **公開**: [npm公開ガイド](./npm-publishing-guide.md)でプラグインを共有

## 参考プラグイン

既存のプラグインから学ぶ：

| プラグイン | 特徴 | 学習ポイント |
|-----------|------|-------------|
| [GUIChatPluginQuiz](https://github.com/receptron/GUIChatPluginQuiz) | シンプルなデータ表示 | 初心者向け |
| [GUIChatPluginOthello](https://github.com/receptron/GUIChatPluginOthello) | インタラクティブゲーム | ユーザー操作 |
| [GUIChatPluginHtml](https://github.com/receptron/GUIChatPluginHtml) | HTMLレンダリング | 表示パターン |
| [GUIChatPluginMap](https://github.com/receptron/GUIChatPluginMap) | Google Maps | 外部API |

## リソース

- [gui-chat-protocol npm](https://www.npmjs.com/package/gui-chat-protocol) - 共有型定義
- [MulmoChat](https://github.com/receptron/MulmoChat) - ホストアプリケーション
- [Vue 3 ドキュメント](https://ja.vuejs.org/)
- [React ドキュメント](https://ja.react.dev/)
