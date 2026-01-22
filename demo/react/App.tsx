import { useState, useRef, useEffect } from "react";
import { plugin, View, Preview } from "../../src/react";
import { useChat } from "./useChat";
import type { ToolResult, ToolSample, ToolPluginReact } from "gui-chat-protocol/react";

function App() {
  const currentPlugin = plugin as unknown as ToolPluginReact;

  // Chat hook
  const {
    messages,
    setMessages,
    isLoading,
    error,
    result,
    setResult,
    useMockMode,
    hasApiKey,
    sendMessage,
    clearMessages,
    toggleMockMode,
    executePlugin,
  } = useChat({
    plugin: currentPlugin,
  });

  // Local state
  const [userInput, setUserInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Plugin info
  const pluginName = currentPlugin.toolDefinition.name;
  const samples = currentPlugin.samples || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Actions
  const handleSend = async () => {
    const text = userInput.trim();
    if (!text || isLoading) return;

    setUserInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't submit while composing (IME input)
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendTextMessage = (text?: string) => {
    if (text) {
      setUserInput(text);
      // Use setTimeout to allow state update before sending
      setTimeout(() => {
        sendMessage(text);
        setUserInput("");
      }, 0);
    }
    console.log("sendTextMessage called:", text);
  };

  const handleUpdateResult = (updated: ToolResult) => {
    setResult(updated);
    console.log("Result updated:", updated);
  };

  const executeSample = async (sample: ToolSample) => {
    const toolResult = await executePlugin(sample.args);
    setResult(toolResult);

    // Add messages in correct order for OpenAI API
    // IMPORTANT: tool_calls must be followed by tool response message
    const toolCallId = `sample_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      // 1. Assistant message with tool_calls
      {
        role: "assistant" as const,
        content: "",
        toolCalls: [
          {
            id: toolCallId,
            name: currentPlugin.toolDefinition.name,
            arguments: JSON.stringify(sample.args),
          },
        ],
      },
      // 2. Tool response message (required by OpenAI)
      {
        role: "tool" as const,
        content: JSON.stringify(toolResult.jsonData || toolResult.message),
        toolCallId,
      },
      // 3. Final assistant message
      {
        role: "assistant" as const,
        content: `Executed sample: ${sample.name}`,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{pluginName} Demo (React)</h1>

        {/* Settings Panel */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMockMode}
                  onChange={toggleMockMode}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Mock Mode (no API key needed)</span>
              </label>
              {hasApiKey && !useMockMode && (
                <span className="text-xs text-green-600">API Key loaded from .env</span>
              )}
            </div>
            <button
              onClick={clearMessages}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear Chat
            </button>
          </div>
          {!hasApiKey && !useMockMode && (
            <p className="mt-2 text-xs text-amber-600">
              No API key found. Create a .env file with VITE_OPENAI_API_KEY=your-key
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Chat Panel */}
          <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700">Chat</h2>
              <p className="text-xs text-gray-500">
                {useMockMode ? "Mock mode - try 'quiz' or 'hello'" : "Real API mode"}
              </p>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg max-w-[85%] ${
                    message.role === "user"
                      ? "bg-indigo-100 ml-auto text-right"
                      : message.role === "assistant"
                        ? "bg-gray-100"
                        : "bg-amber-50 text-xs font-mono"
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">{message.role}</div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.toolCalls && (
                    <div className="mt-2 text-xs text-indigo-600">
                      Tool call: {message.toolCalls.map((tc) => tc.name).join(", ")}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="text-center text-gray-500 text-sm">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type="text"
                  placeholder="Type a message... (try 'show me a quiz')"
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !userInput.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Right: Plugin View */}
          <div className="space-y-4">
            {/* View Component */}
            {result ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-700">View Component</h2>
                </div>
                <div className="p-4">
                  <View
                    selectedResult={result}
                    sendTextMessage={handleSendTextMessage}
                    onUpdateResult={handleUpdateResult}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                <p>Send a message to see the plugin view</p>
                <p className="text-sm mt-2">Try: "show me a quiz" or "create a quiz about JavaScript"</p>
              </div>
            )}

            {/* Preview Component */}
            {result && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-700">Preview Component</h2>
                </div>
                <div className="p-4">
                  <div className="max-w-[200px]">
                    <Preview result={result} />
                  </div>
                </div>
              </div>
            )}

            {/* Sample Buttons */}
            {samples.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-700">Quick Samples</h2>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {samples.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => executeSample(sample)}
                      className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result Data (Debug) */}
            <details className="bg-white rounded-lg shadow-md overflow-hidden">
              <summary className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50">
                <span className="text-lg font-semibold text-gray-700">Result Data (Debug)</span>
              </summary>
              <div className="p-4">
                <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
