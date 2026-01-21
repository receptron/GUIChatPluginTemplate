import { useState, useEffect } from "react";
import { plugin, View, Preview } from "../src/react";
import type { ToolResult, ToolSample } from "gui-chat-protocol/react";

function App() {
  const pluginName = plugin.toolDefinition.name;
  const samples = plugin.samples || [];

  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [lastSentMessage, setLastSentMessage] = useState("");
  const [result, setResult] = useState<ToolResult>({
    toolName: pluginName,
    message: "Ready",
    title: "",
    jsonData: undefined,
  });

  const loadSample = (sample: ToolSample) => {
    setJsonInput(JSON.stringify(sample.args, null, 2));
    setJsonError("");
    // Apply the sample data
    const data = sample.args;
    setResult({
      toolName: pluginName,
      message: "Data applied",
      title: (data as { title?: string }).title || "",
      jsonData: data,
    });
    setLastSentMessage("");
  };

  const applyJson = () => {
    try {
      const data = JSON.parse(jsonInput);
      setResult({
        toolName: pluginName,
        message: "Data applied",
        title: data.title || "",
        jsonData: data,
      });
      setJsonError("");
      setLastSentMessage("");
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const handleSendTextMessage = (text?: string) => {
    setLastSentMessage(text || "");
    console.log("sendTextMessage called:", text);
  };

  const handleUpdate = (updated: ToolResult) => {
    setResult(updated);
    console.log("Result updated:", updated);
  };

  // Load first sample on mount
  useEffect(() => {
    if (samples.length > 0) {
      loadSample(samples[0]);
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-gray-800 mb-8">{pluginName} Demo (React)</h1>

      {/* JSON Data Input Section */}
      <div className="bg-white rounded-lg p-5 mb-5 shadow-md">
        <h2 className="text-gray-600 text-xl mb-4">JSON Data Input</h2>
        {samples.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {samples.map((sample, index) => (
              <button
                key={index}
                onClick={() => loadSample(sample)}
                className="py-2 px-4 bg-indigo-100 border border-indigo-200 rounded-md cursor-pointer text-sm text-indigo-700 transition-all hover:bg-indigo-200 hover:border-indigo-300"
              >
                {sample.name}
              </button>
            ))}
          </div>
        )}
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full p-3 font-mono text-sm border border-gray-300 rounded-md resize-y bg-gray-50 focus:outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10"
          placeholder="Enter JSON data here..."
          rows={10}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={applyJson}
            className="py-2.5 px-6 bg-indigo-600 text-white border-none rounded-md cursor-pointer text-sm font-medium transition-colors hover:bg-indigo-700"
          >
            Apply JSON
          </button>
          {jsonError && <span className="text-red-600 text-sm">{jsonError}</span>}
        </div>
      </div>

      {/* View Component */}
      <div className="bg-white rounded-lg p-5 mb-5 shadow-md">
        <h2 className="text-gray-600 text-xl mb-4">View Component</h2>
        <div className="overflow-hidden rounded-lg">
          <View
            selectedResult={result}
            sendTextMessage={handleSendTextMessage}
            onUpdateResult={handleUpdate}
          />
        </div>
        {lastSentMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
            <strong className="text-emerald-800 block mb-2">Sent Message:</strong>
            <pre className="bg-emerald-100 m-0 whitespace-pre-wrap">{lastSentMessage}</pre>
          </div>
        )}
      </div>

      {/* Preview Component */}
      <div className="bg-white rounded-lg p-5 mb-5 shadow-md">
        <h2 className="text-gray-600 text-xl mb-4">Preview Component</h2>
        <div className="max-w-[200px]">
          <Preview result={result} />
        </div>
      </div>

      {/* Current Result Data */}
      <div className="bg-white rounded-lg p-5 mb-5 shadow-md">
        <h2 className="text-gray-600 text-xl mb-4">Current Result Data</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default App;
