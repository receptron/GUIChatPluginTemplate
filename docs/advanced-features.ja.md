# 高度な機能ガイド

このガイドでは、プラグインに高度な機能を追加する方法を説明します。

## 目次

1. [インタラクティブ性の追加（sendTextMessage）](#1-インタラクティブ性の追加sendtextmessage)
2. [状態の永続化（viewState）](#2-状態の永続化viewstate)
3. [Tailwind CSSでのスタイリング](#3-tailwind-cssでのスタイリング)

---

## 1. インタラクティブ性の追加（sendTextMessage）

### sendTextMessageとは？

`sendTextMessage`は、Viewコンポーネントからチャットにメッセージを送信する関数です。ユーザーの操作（ボタンクリック、選択など）をチャットに反映させることができます。

```
ユーザーがViewで操作
    ↓
sendTextMessage("メッセージ")
    ↓
チャットに送信される
    ↓
LLMが応答を生成
```

### 関数シグネチャ

```typescript
sendTextMessage: (text?: string, options?: SendTextMessageOptions) => void;

interface SendTextMessageOptions {
  data?: unknown;  // デバッグ/テスト用のオプションデータ
}
```

### Vueでの使い方

**1. propsで受け取る:**

```vue
<script setup lang="ts">
const props = defineProps<{
  selectedResult: ToolResult;
  sendTextMessage: (text?: string, options?: SendTextMessageOptions) => void;
}>();
</script>
```

**2. 関数を呼び出す:**

```vue
<script setup lang="ts">
function handleSubmit() {
  props.sendTextMessage("ユーザーのメッセージ");
}
</script>

<template>
  <button @click="handleSubmit">送信</button>
</template>
```

### Reactでの使い方

```tsx
import type { ViewComponentProps } from "gui-chat-protocol";
import type { MyData } from "../core/types";

export function View({ selectedResult, sendTextMessage }: ViewComponentProps<never, MyData>) {
  const handleSubmit = () => {
    sendTextMessage("ユーザーのメッセージ");
  };

  return <button onClick={handleSubmit}>送信</button>;
}
```

### 実践例1: クイズの回答を送信

```vue
<script setup lang="ts">
import { ref, computed } from "vue";

const userAnswers = ref<(number | null)[]>([]);

const allQuestionsAnswered = computed(() => {
  return userAnswers.value.every(answer => answer !== null);
});

function handleSubmit() {
  if (!allQuestionsAnswered.value) return;

  // 回答をフォーマットしてメッセージを作成
  const answerText = userAnswers.value
    .map((answer, index) => {
      const questionNum = index + 1;
      const choiceLetter = String.fromCharCode(65 + answer!); // A, B, C...
      return `Q${questionNum}: ${choiceLetter}`;
    })
    .join("\n");

  const message = `回答を送信します:\n${answerText}`;
  props.sendTextMessage(message);
}
</script>

<template>
  <button
    @click="handleSubmit"
    :disabled="!allQuestionsAnswered"
  >
    回答を送信
  </button>
</template>
```

### 実践例2: ゲームの手を送信（オセロ）

```vue
<script setup lang="ts">
interface CellData {
  row: number;
  col: number;
  isLegalMove: boolean;
}

function handleCellClick(cell: CellData) {
  if (!cell.isLegalMove) return;

  // 列を文字に変換（A, B, C...）
  const columnLetter = String.fromCharCode(65 + cell.col);
  const rowNumber = cell.row + 1;

  // オプションでデバッグ用データを追加
  const clickData = {
    row: cell.row,
    col: cell.col,
    currentState: gameState.value,
  };

  props.sendTextMessage(
    `${columnLetter}${rowNumber}に置きます（列=${cell.col}, 行=${cell.row}）`,
    { data: clickData }  // デバッグ用
  );
}
</script>
```

### 実践例3: 三目並べの手を送信

```vue
<script setup lang="ts">
function handleCellClick(index: number) {
  const cell = flatBoard.value[index];
  if (!cell.isLegalMove) return;

  const rowNames = ["上", "中", "下"];
  const colNames = ["左", "真ん中", "右"];
  const positionName = `${rowNames[cell.row]}の${colNames[cell.col]}`;

  props.sendTextMessage?.(`${positionName}に置きます`);
}
</script>
```

### ベストプラクティス

1. **オプショナルチェーン**を使う（propsが未定義の場合に備えて）:
   ```typescript
   props.sendTextMessage?.("メッセージ");
   ```

2. **意味のあるメッセージ**を送信する（LLMが理解しやすいように）:
   ```typescript
   // ✅ 良い例
   props.sendTextMessage("B3に黒を置きます");

   // ❌ 悪い例
   props.sendTextMessage("clicked");
   ```

3. **デバッグ用データ**はoptionsで渡す:
   ```typescript
   props.sendTextMessage("メッセージ", { data: debugInfo });
   ```

---

## 2. 状態の永続化（viewState）

### viewStateとは？

`viewState`は、Viewコンポーネントの状態を保存するための仕組みです。ユーザーが別の結果を選択して戻ってきたときに、以前の状態（入力値、選択状態など）を復元できます。

```
ユーザーが結果Aを選択
    ↓
結果AのViewで操作（チェックボックスを選択）
    ↓
viewStateに保存
    ↓
ユーザーが結果Bに切り替え
    ↓
ユーザーが結果Aに戻る
    ↓
viewStateから状態を復元（チェックボックスが選択された状態に戻る）
```

### ToolResultのviewStateフィールド

```typescript
interface ToolResult<T = unknown, J = unknown> {
  toolName?: string;
  message: string;
  data?: T;                              // UI用データ
  jsonData?: J;                          // LLM用データ
  viewState?: Record<string, unknown>;   // ← UI状態の保存用
}
```

### 基本的な使い方（Vue）

**ステップ1: 状態を復元する**

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol";

const props = defineProps<{
  selectedResult: ToolResult;
}>();

const userAnswers = ref<(number | null)[]>([]);

// selectedResultが変わったときに状態を復元
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.viewState?.userAnswers) {
      // viewStateから復元
      userAnswers.value = newResult.viewState.userAnswers as (number | null)[];
    } else {
      // 初期状態
      userAnswers.value = [];
    }
  },
  { immediate: true }  // マウント時にも実行
);
</script>
```

**ステップ2: 状態を保存する**

```vue
<script setup lang="ts">
import type { ToolResult } from "gui-chat-protocol";

const emit = defineEmits<{
  updateResult: [result: ToolResult];
}>();

// 状態が変わったときにviewStateを更新
watch(
  userAnswers,
  (newAnswers) => {
    if (props.selectedResult) {
      const updatedResult: ToolResult = {
        ...props.selectedResult,
        viewState: {
          userAnswers: newAnswers,
        },
      };
      emit("updateResult", updatedResult);
    }
  },
  { deep: true }  // 配列/オブジェクトの深い変更を検知
);
</script>
```

### 基本的な使い方（React）

```tsx
import { useState, useEffect, useCallback } from "react";
import type { ViewComponentProps } from "gui-chat-protocol";

export function View({ selectedResult, onUpdateResult }: ViewComponentProps<never, MyData>) {
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

  // 状態を復元
  useEffect(() => {
    if (selectedResult?.viewState?.userAnswers) {
      setUserAnswers(selectedResult.viewState.userAnswers as (number | null)[]);
    } else {
      setUserAnswers([]);
    }
  }, [selectedResult]);

  // 状態を保存
  const updateAnswers = useCallback(
    (newAnswers: (number | null)[]) => {
      setUserAnswers(newAnswers);
      if (onUpdateResult) {
        onUpdateResult({
          viewState: { userAnswers: newAnswers },
        });
      }
    },
    [onUpdateResult]
  );

  return (/* ... */);
}
```

### 実践例1: クイズの回答状態

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { QuizData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult;
}>();

const emit = defineEmits<{
  updateResult: [result: ToolResult];
}>();

const quizData = ref<QuizData | null>(null);
const userAnswers = ref<(number | null)[]>([]);

// 復元
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.jsonData) {
      quizData.value = newResult.jsonData as QuizData;

      if (newResult.viewState?.userAnswers) {
        userAnswers.value = newResult.viewState.userAnswers as (number | null)[];
      } else {
        // 新規の場合は質問数分の配列を初期化
        userAnswers.value = new Array(quizData.value.questions.length).fill(null);
      }
    }
  },
  { immediate: true }
);

// 保存
watch(
  userAnswers,
  (newAnswers) => {
    if (props.selectedResult && newAnswers) {
      emit("updateResult", {
        ...props.selectedResult,
        viewState: {
          userAnswers: newAnswers,
        },
      });
    }
  },
  { deep: true }
);
</script>
```

### 実践例2: キャンバスの描画状態

```vue
<script setup lang="ts">
interface CanvasDrawingState {
  strokes: unknown[];
  brushSize: number;
  brushColor: string;
}

const brushSize = ref(5);
const brushColor = ref("#000000");
const strokes = ref<unknown[]>([]);

// 復元
function restoreDrawingState() {
  if (props.selectedResult?.viewState?.drawingState) {
    const state = props.selectedResult.viewState.drawingState as CanvasDrawingState;
    brushSize.value = state.brushSize || 5;
    brushColor.value = state.brushColor || "#000000";
    strokes.value = state.strokes || [];
  }
}

// 保存
function saveDrawingState() {
  const drawingState: CanvasDrawingState = {
    strokes: strokes.value,
    brushSize: brushSize.value,
    brushColor: brushColor.value,
  };

  emit("updateResult", {
    ...props.selectedResult,
    viewState: { drawingState },
  });
}

// 描画が変わったときに保存
watch([brushSize, brushColor, strokes], saveDrawingState, { deep: true });
</script>
```

### 実践例3: 3Dカメラの位置

```vue
<script setup lang="ts">
interface CameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

// 復元
function restoreCameraState() {
  const state = props.selectedResult?.viewState?.cameraState as CameraState | undefined;
  if (state) {
    camera.position.set(state.position.x, state.position.y, state.position.z);
    controls.target.set(state.target.x, state.target.y, state.target.z);
  }
}

// 保存（デバウンス付き）
let saveTimeout: number | null = null;

function saveCameraState() {
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = window.setTimeout(() => {
    const cameraState: CameraState = {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
    };

    emit("updateResult", {
      ...props.selectedResult,
      viewState: { cameraState },
    });
  }, 500);  // 500ms後に保存
}
</script>
```

### ベストプラクティス

1. **`{ immediate: true }`を使う** - マウント時に即座に復元:
   ```typescript
   watch(() => props.selectedResult, handler, { immediate: true });
   ```

2. **`{ deep: true }`を使う** - ネストされたオブジェクトの変更を検知:
   ```typescript
   watch(userAnswers, handler, { deep: true });
   ```

3. **デバウンス**を使う - 頻繁な更新を避ける:
   ```typescript
   let timeout: number | null = null;
   function debouncedSave() {
     if (timeout) clearTimeout(timeout);
     timeout = setTimeout(save, 500);
   }
   ```

4. **既存のviewStateを保持**する:
   ```typescript
   emit("updateResult", {
     ...props.selectedResult,
     viewState: {
       ...props.selectedResult.viewState,  // 既存の状態を保持
       newField: newValue,                  // 新しいフィールドを追加
     },
   });
   ```

---

## 3. Tailwind CSSでのスタイリング

### 設定

GUIChatPluginTemplateでは、Tailwind CSS 4が設定済みです。

**vite.config.ts:**
```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
});
```

**src/style.css:**
```css
@import "tailwindcss";
```

### 基本的なスタイリング

**Vue:**
```vue
<template>
  <div class="w-full h-full p-4 bg-white">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">タイトル</h1>
    <p class="text-gray-600">説明文</p>
  </div>
</template>
```

**React:**
```tsx
return (
  <div className="w-full h-full p-4 bg-white">
    <h1 className="text-2xl font-bold text-gray-800 mb-4">タイトル</h1>
    <p className="text-gray-600">説明文</p>
  </div>
);
```

### よく使うユーティリティクラス

#### サイズ

| クラス | 説明 |
|--------|------|
| `w-full` | 幅100% |
| `h-full` | 高さ100% |
| `size-full` | 幅・高さ100%（Tailwind 4） |
| `size-4` | 幅・高さ1rem |
| `min-h-[300px]` | 最小高さ300px |
| `max-w-3xl` | 最大幅48rem |

#### 余白

| クラス | 説明 |
|--------|------|
| `p-4` | padding: 1rem |
| `px-4` | padding左右: 1rem |
| `py-2` | padding上下: 0.5rem |
| `m-4` | margin: 1rem |
| `mb-4` | margin-bottom: 1rem |
| `gap-4` | flex/gridの間隔: 1rem |

#### Flexbox

| クラス | 説明 |
|--------|------|
| `flex` | display: flex |
| `flex-col` | flex-direction: column |
| `items-center` | align-items: center |
| `justify-center` | justify-content: center |
| `justify-between` | justify-content: space-between |
| `flex-1` | flex: 1（残りスペースを埋める） |
| `flex-shrink-0` | flex-shrink: 0 |

#### Grid

| クラス | 説明 |
|--------|------|
| `grid` | display: grid |
| `grid-cols-3` | 3列グリッド |
| `grid-cols-8` | 8列グリッド |
| `gap-2` | グリッド間隔: 0.5rem |

#### テキスト

| クラス | 説明 |
|--------|------|
| `text-lg` | font-size: 1.125rem |
| `text-2xl` | font-size: 1.5rem |
| `font-bold` | font-weight: 700 |
| `text-center` | text-align: center |
| `text-gray-600` | 色: グレー |
| `truncate` | 省略記号（...） |

#### 背景・ボーダー

| クラス | 説明 |
|--------|------|
| `bg-white` | 背景: 白 |
| `bg-gray-100` | 背景: 薄いグレー |
| `bg-blue-600` | 背景: 青 |
| `rounded` | border-radius: 0.25rem |
| `rounded-lg` | border-radius: 0.5rem |
| `border` | border: 1px solid |
| `border-2` | border: 2px solid |
| `border-gray-300` | ボーダー色: グレー |

#### インタラクション

| クラス | 説明 |
|--------|------|
| `hover:bg-blue-700` | ホバー時の背景色 |
| `cursor-pointer` | カーソル: ポインター |
| `transition-colors` | 色のトランジション |
| `transition-all` | すべてのトランジション |
| `duration-200` | トランジション時間: 200ms |

### カスタムカラー（任意値）

Tailwindのデフォルトカラー以外を使う場合:

```vue
<template>
  <div class="bg-[#1a1a2e] text-[#f0f0f0] border-[#3d3d5c]">
    カスタムカラー
  </div>
</template>
```

### 条件付きスタイリング（Vue）

**`:class`バインディング:**

```vue
<template>
  <button
    :class="[
      'py-2 px-4 rounded font-semibold transition-colors',
      isEnabled
        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
    ]"
    :disabled="!isEnabled"
  >
    ボタン
  </button>
</template>
```

**オブジェクト構文:**

```vue
<template>
  <div
    :class="{
      'bg-green-600': isSelected,
      'bg-gray-200': !isSelected,
      'hover:bg-green-500': isClickable,
    }"
  >
    セル
  </div>
</template>
```

**関数で生成:**

```vue
<script setup lang="ts">
function getCellClass(cell: Cell) {
  const base = "w-12 h-12 flex items-center justify-center border";
  const state = cell.isSelected ? "bg-blue-500" : "bg-white";
  const hover = cell.isClickable ? "hover:bg-blue-200 cursor-pointer" : "";
  return `${base} ${state} ${hover}`;
}
</script>

<template>
  <div
    v-for="cell in cells"
    :key="cell.id"
    :class="getCellClass(cell)"
  >
    {{ cell.value }}
  </div>
</template>
```

### 条件付きスタイリング（React）

```tsx
<button
  className={`py-2 px-4 rounded font-semibold transition-colors ${
    isEnabled
      ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
      : "bg-gray-400 text-gray-200 cursor-not-allowed"
  }`}
  disabled={!isEnabled}
>
  ボタン
</button>
```

### ダークテーマの例（クイズ）

```vue
<template>
  <div class="size-full overflow-y-auto p-8 bg-[#1a1a2e]">
    <div class="max-w-3xl w-full mx-auto">
      <!-- タイトル -->
      <h2 class="text-[#f0f0f0] text-3xl font-bold mb-8 text-center">
        {{ title }}
      </h2>

      <!-- 質問カード -->
      <div class="flex flex-col gap-6">
        <div
          v-for="(question, index) in questions"
          :key="index"
          class="bg-[#2d2d44] rounded-lg p-6 border-2 border-[#3d3d5c]"
        >
          <!-- 質問テキスト -->
          <div class="text-white text-lg font-semibold mb-4">
            <span class="text-blue-400 mr-2">{{ index + 1 }}.</span>
            {{ question.text }}
          </div>

          <!-- 選択肢 -->
          <div class="flex flex-col gap-3">
            <label
              v-for="(choice, cIndex) in question.choices"
              :key="cIndex"
              :class="[
                'flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 border-2',
                selectedAnswer === cIndex
                  ? 'bg-blue-900 border-blue-500'
                  : 'bg-[#3d3d5c] border-transparent hover:border-blue-400'
              ]"
            >
              <input
                type="radio"
                :value="cIndex"
                v-model="selectedAnswer"
                class="mr-3 size-4"
              />
              <span class="text-white">{{ choice }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 送信ボタン -->
      <div class="mt-8 flex justify-center">
        <button
          @click="handleSubmit"
          :class="[
            'py-3 px-8 rounded-lg font-semibold text-lg transition-colors',
            canSubmit
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
          ]"
          :disabled="!canSubmit"
        >
          回答を送信
        </button>
      </div>
    </div>
  </div>
</template>
```

### ゲームボード（グリッド）の例（オセロ）

```vue
<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-4">
    <!-- ターン表示 -->
    <div class="text-white text-lg font-bold mb-4">
      現在のターン: {{ currentPlayer }}
    </div>

    <!-- ゲームボード -->
    <div class="grid grid-cols-8 gap-0.5 p-4 bg-green-800 rounded-lg border-2 border-green-900">
      <div
        v-for="(cell, index) in board"
        :key="index"
        :class="[
          'w-12 h-12 flex items-center justify-center bg-green-700 border border-green-900',
          cell.isLegalMove && 'cursor-pointer hover:bg-green-600'
        ]"
        @click="handleCellClick(cell)"
      >
        <!-- 駒 -->
        <div
          v-if="cell.piece"
          :class="[
            'w-10 h-10 rounded-full border-2 border-gray-600',
            cell.piece === 'black' ? 'bg-black' : 'bg-white'
          ]"
        />

        <!-- 合法手の表示 -->
        <div
          v-else-if="cell.isLegalMove"
          class="w-3 h-3 rounded-full bg-green-400 opacity-50"
        />
      </div>
    </div>
  </div>
</template>
```

### Previewコンポーネントの例

```vue
<template>
  <div class="p-3 bg-blue-50 rounded text-center">
    <div class="text-blue-600 font-medium">{{ title }}</div>
    <div class="text-xs text-gray-600 mt-1 truncate">
      {{ subtitle }}
    </div>
  </div>
</template>
```

### ベストプラクティス

1. **ユーティリティクラスを優先** - scoped CSSよりTailwindクラスを使う

2. **一貫したスペーシング** - `gap-4`, `p-4`, `mb-4`などを統一的に使う

3. **レスポンシブ対応** - `max-w-3xl mx-auto`で中央揃えと最大幅を設定

4. **トランジション追加** - インタラクティブな要素には`transition-colors duration-200`

5. **オーバーフロー処理** - スクロール可能なコンテナには`overflow-y-auto`

6. **Flexの活用** - `flex-1`と`min-h-0`でフレキシブルなレイアウト

---

## 参考リンク

- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)
- [Vue 3 ドキュメント](https://ja.vuejs.org/)
- [gui-chat-protocol](https://github.com/receptron/gui-chat-protocol)
