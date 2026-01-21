/**
 * Quiz View Component (React)
 */

import { useState, useEffect, useCallback } from "react";
import type { ViewComponentProps } from "gui-chat-protocol";
import type { QuizData } from "../core/types";
import { TOOL_NAME } from "../core/definition";

type ViewProps = ViewComponentProps<never, QuizData>;

export function View({ selectedResult, sendTextMessage, onUpdateResult }: ViewProps) {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

  useEffect(() => {
    if (selectedResult?.toolName === TOOL_NAME && selectedResult.jsonData) {
      const data = selectedResult.jsonData as QuizData;
      setQuizData(data);
      // Restore user answers from viewState or initialize new array
      if (selectedResult.viewState?.userAnswers) {
        setUserAnswers(selectedResult.viewState.userAnswers as (number | null)[]);
      } else {
        setUserAnswers(new Array(data.questions.length).fill(null));
      }
    }
  }, [selectedResult]);

  // Save answers to viewState
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

  const handleAnswerChange = (qIndex: number, cIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = cIndex;
    updateAnswers(newAnswers);
  };

  const answeredCount = userAnswers.filter((answer) => answer !== null).length;
  const allQuestionsAnswered = quizData && answeredCount === quizData.questions.length;

  const getChoiceClass = (qIndex: number, cIndex: number): string => {
    const isSelected = userAnswers[qIndex] === cIndex;
    if (isSelected) {
      return "border-blue-500 bg-blue-500/20";
    }
    return "border-[#4b4b6b] hover:border-[#6b6b8b] hover:bg-[#6b6b8b]/20";
  };

  const handleSubmit = () => {
    if (!quizData || !allQuestionsAnswered) return;

    const answerText = userAnswers
      .map((answer, index) => {
        if (answer === null) return null;
        const questionNum = index + 1;
        const choiceLetter = String.fromCharCode(65 + answer);
        const choiceText = quizData.questions[index].choices[answer];
        return `Q${questionNum}: ${choiceLetter} - ${choiceText}`;
      })
      .filter((text) => text !== null)
      .join("\n");

    const message = `Here are my answers:\n${answerText}`;
    sendTextMessage(message);
  };

  if (!quizData) {
    return null;
  }

  return (
    <div className="w-full min-h-[400px] overflow-y-auto p-8 bg-[#1a1a2e] rounded-lg">
      <div className="max-w-3xl mx-auto">
        {/* Quiz Title */}
        {quizData.title && (
          <h2 className="text-[#f0f0f0] text-3xl font-bold mb-8 text-center">
            {quizData.title}
          </h2>
        )}

        {/* Questions */}
        <div className="flex flex-col gap-6">
          {quizData.questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="bg-[#2d2d44] rounded-lg p-6 border-2 border-[#3d3d5c]"
            >
              {/* Question Text */}
              <div className="text-white text-lg font-semibold mb-4">
                <span className="text-blue-400 mr-2">{qIndex + 1}.</span>
                {question.question}
              </div>

              {/* Answer Choices */}
              <div className="flex flex-col gap-3">
                {question.choices.map((choice, cIndex) => (
                  <label
                    key={cIndex}
                    className={`flex items-start p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${getChoiceClass(qIndex, cIndex)}`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value={cIndex}
                      checked={userAnswers[qIndex] === cIndex}
                      onChange={() => handleAnswerChange(qIndex, cIndex)}
                      className="mt-1 mr-3 size-4 shrink-0"
                    />
                    <span className="text-white flex-1">
                      <span className="font-semibold mr-2">
                        {String.fromCharCode(65 + cIndex)}.
                      </span>
                      {choice}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered}
            className={`py-3 px-8 rounded-lg text-white font-semibold text-lg transition-colors border-none cursor-pointer ${
              allQuestionsAnswered
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 cursor-not-allowed opacity-50"
            }`}
          >
            Submit Answers
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 text-center text-gray-400 text-sm">
          {answeredCount} / {quizData.questions.length} questions answered
        </div>
      </div>
    </div>
  );
}

export default View;
