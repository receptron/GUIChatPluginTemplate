/**
 * Quiz Preview Component (React)
 */

import type { PreviewComponentProps } from "gui-chat-protocol";
import type { QuizData } from "../core/types";

type PreviewProps = PreviewComponentProps<never, QuizData>;

export function Preview({ result }: PreviewProps) {
  const quizData = result.jsonData as QuizData | null;

  if (!quizData) {
    return null;
  }

  return (
    <div className="p-3 bg-blue-50 rounded-md">
      <div className="flex flex-col gap-2">
        {/* Quiz Title */}
        <div className="text-sm font-semibold text-gray-800 text-center">
          {quizData.title || "Quiz"}
        </div>

        {/* Question Count */}
        <div className="text-center">
          <span className="inline-block bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-full">
            {quizData.questions.length}{" "}
            {quizData.questions.length === 1 ? "Question" : "Questions"}
          </span>
        </div>

        {/* Mini Preview of First Question */}
        <div className="text-xs text-gray-600 overflow-hidden line-clamp-2">
          {quizData.questions[0]?.question}
        </div>

        {/* Choice indicators */}
        <div className="flex justify-center gap-1">
          {Array.from({
            length: Math.min(quizData.questions[0]?.choices.length || 0, 4),
          }).map((_, index) => (
            <div
              key={index}
              className="size-2 bg-gray-400 rounded-full"
            />
          ))}
          {(quizData.questions[0]?.choices.length || 0) > 4 && (
            <span className="text-xs text-gray-500">
              +{quizData.questions[0].choices.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Preview;
