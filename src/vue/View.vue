<template>
  <div class="size-full overflow-y-auto p-8 bg-[#1a1a2e]">
    <div v-if="quizData" class="max-w-3xl w-full mx-auto">
      <!-- Quiz Title -->
      <h2 v-if="quizData.title" class="text-[#f0f0f0] text-3xl font-bold mb-8 text-center">
        {{ quizData.title }}
      </h2>

      <!-- Questions -->
      <div class="flex flex-col gap-6">
        <div
          v-for="(question, qIndex) in quizData.questions"
          :key="qIndex"
          class="bg-[#2d2d44] rounded-lg p-6 border-2 border-[#3d3d5c]"
        >
          <!-- Question Text -->
          <div class="text-white text-lg font-semibold mb-4">
            <span class="text-blue-400 mr-2">{{ qIndex + 1 }}.</span>
            {{ question.question }}
          </div>

          <!-- Answer Choices -->
          <div class="flex flex-col gap-3">
            <label
              v-for="(choice, cIndex) in question.choices"
              :key="cIndex"
              :class="getChoiceClass(qIndex, cIndex)"
              class="flex items-start p-4 rounded-lg cursor-pointer transition-all duration-200 border-2"
            >
              <input
                type="radio"
                :name="`question-${qIndex}`"
                :value="cIndex"
                v-model="userAnswers[qIndex]"
                class="mt-1 mr-3 size-4 shrink-0"
              />
              <span class="text-white flex-1">
                <span class="font-semibold mr-2">{{ String.fromCharCode(65 + cIndex) }}.</span>
                {{ choice }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="mt-8 flex justify-center">
        <button
          @click="handleSubmit"
          :disabled="!allQuestionsAnswered"
          :class="allQuestionsAnswered ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed opacity-50'"
          class="py-3 px-8 rounded-lg text-white font-semibold text-lg transition-colors border-none cursor-pointer"
        >
          Submit Answers
        </button>
      </div>

      <!-- Progress Indicator -->
      <div class="mt-4 text-center text-gray-400 text-sm">
        {{ answeredCount }} / {{ quizData.questions.length }} questions answered
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { QuizData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

const props = defineProps<{
  selectedResult: ToolResult;
  sendTextMessage: (text?: string) => void;
}>();

const emit = defineEmits<{
  updateResult: [result: ToolResult];
}>();

const quizData = ref<QuizData | null>(null);
const userAnswers = ref<(number | null)[]>([]);

watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.jsonData) {
      quizData.value = newResult.jsonData as QuizData;
      // Restore user answers from viewState or initialize new array
      if (newResult.viewState?.userAnswers) {
        userAnswers.value = newResult.viewState.userAnswers as (number | null)[];
      } else {
        userAnswers.value = new Array(quizData.value.questions.length).fill(null);
      }
    }
  },
  { immediate: true },
);

// Watch userAnswers and save to viewState whenever they change
watch(
  userAnswers,
  (newAnswers) => {
    if (props.selectedResult && newAnswers) {
      const updatedResult: ToolResult = {
        ...props.selectedResult,
        viewState: {
          userAnswers: newAnswers,
        },
      };
      emit("updateResult", updatedResult);
    }
  },
  { deep: true },
);

const answeredCount = computed(() => {
  return userAnswers.value.filter((answer) => answer !== null).length;
});

const allQuestionsAnswered = computed(() => {
  return quizData.value && answeredCount.value === quizData.value.questions.length;
});

function getChoiceClass(qIndex: number, cIndex: number): string {
  const isSelected = userAnswers.value[qIndex] === cIndex;
  if (isSelected) {
    return "border-blue-500 bg-blue-500/20";
  }
  return "border-[#4b4b6b] hover:border-[#6b6b8b] hover:bg-[#6b6b8b]/20";
}

function handleSubmit(): void {
  if (!quizData.value || !allQuestionsAnswered.value) return;

  // Format answers as text
  const answerText = userAnswers.value
    .map((answer, index) => {
      if (answer === null) return null;
      const questionNum = index + 1;
      const choiceLetter = String.fromCharCode(65 + answer);
      const choiceText = quizData.value!.questions[index].choices[answer];
      return `Q${questionNum}: ${choiceLetter} - ${choiceText}`;
    })
    .filter((text) => text !== null)
    .join("\n");

  const message = `Here are my answers:\n${answerText}`;
  props.sendTextMessage(message);
}
</script>
