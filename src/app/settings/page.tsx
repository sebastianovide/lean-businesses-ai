"use client";

import React, { useState } from "react";
import Link from "next/link";

const Settings: React.FC = () => {
  const [aiConfig, setAiConfig] = useState({
    service: "Mastra Agent",
    ollamaUrl: "Managed by Server",
    ollamaModel: "Managed by Server",
    geminiModel: "Managed by Server",
    apiKey: "Managed by Server",
  });

  const handleSave = () => {
    // Save settings logic here
    alert("Settings are currently managed by the server.");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Editor
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Configure your application preferences
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold">
              Note: AI settings are currently managed by the Mastra server agent. Client-side configuration is disabled.
            </p>
          </div>

          <h2 className="text-xl font-bold mb-6 text-blue-700">
            AI Service Configuration
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                AI Service
              </label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={aiConfig.service}
                disabled
              >
                <option value="Mastra Agent">Mastra Agent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Configuration
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value="Managed by Server"
                disabled
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                className="w-full bg-gray-400 text-white py-3 rounded-lg cursor-not-allowed font-semibold"
                disabled
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-700">About</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>Framework:</strong> Next.js 15 + Mastra
            </p>
            <p>
              <strong>AI Lean Canvas:</strong> Build and iterate on your
              business model
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
