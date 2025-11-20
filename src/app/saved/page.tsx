"use client";

import React from "react";
import Link from "next/link";

const SavedCanvases: React.FC = () => {
  const savedCanvases = [
    { id: "1", name: "E-commerce Platform", date: "2024-01-15" },
    { id: "2", name: "Mobile App Startup", date: "2024-01-10" },
    { id: "3", name: "SaaS Solution", date: "2024-01-05" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Editor
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Saved Canvases
          </h1>
          <p className="text-gray-600">
            Manage your saved Lean Canvas projects
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {savedCanvases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No saved canvases yet</p>
              <Link
                href="/canvas"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Canvas
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedCanvases.map((canvas) => (
                <div
                  key={canvas.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {canvas.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Created: {canvas.date}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        Open
                      </button>
                      <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedCanvases;
