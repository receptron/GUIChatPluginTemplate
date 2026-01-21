/**
 * Quiz Sample Data
 */

import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "JavaScript Quiz",
    args: {
      title: "JavaScript Basics",
      questions: [
        {
          question: "What does 'const' do in JavaScript?",
          choices: [
            "Declares a constant variable",
            "Declares a mutable variable",
            "Creates a function",
            "Imports a module",
          ],
          correctAnswer: 0,
        },
        {
          question: "Which method adds an element to the end of an array?",
          choices: ["pop()", "shift()", "push()", "unshift()"],
          correctAnswer: 2,
        },
        {
          question: "What is the output of: typeof null?",
          choices: ['"null"', '"undefined"', '"object"', '"boolean"'],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    name: "World Capitals",
    args: {
      title: "World Capitals Quiz",
      questions: [
        {
          question: "What is the capital of Japan?",
          choices: ["Osaka", "Kyoto", "Tokyo", "Hiroshima"],
          correctAnswer: 2,
        },
        {
          question: "What is the capital of Australia?",
          choices: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
          correctAnswer: 2,
        },
      ],
    },
  },
  {
    name: "Simple Yes/No",
    args: {
      questions: [
        {
          question: "Is the Earth round?",
          choices: ["Yes", "No"],
          correctAnswer: 0,
        },
      ],
    },
  },
];
