"use client";

import React from "react";
import Link from "next/link";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <style>{`
        .dot-typing {
          display: inline-block;
        }
        .dot-typing .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin: 0 1px;
          background: #888;
          border-radius: 50%;
          animation: dot-typing 1s infinite linear alternate;
        }
        .dot-typing .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot-typing .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes dot-typing {
          0% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
          100% { opacity: 0.2; transform: translateY(0); }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 flex gap-6">
        {/* Main content (canvas) */}
        <div className="flex-1 min-w-0">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lean Canvas Editor
            </h1>
            <p className="text-gray-600">Build your business model canvas</p>
          </div>

          {/* Navigation */}
          <div className="mb-6 flex justify-center gap-4">
            <Link
              href="/canvas"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Canvas Editor
            </Link>
            <Link
              href="/saved"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Saved Canvases
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Settings
            </Link>
          </div>

          {/* Welcome content */}
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to AI Lean Canvas
              </h2>
              <p className="text-gray-500 mb-4">
                Build and iterate on your business model with AI assistance
              </p>
              <Link
                href="/canvas"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Start Building Your Canvas
              </Link>
              <p className="text-sm text-gray-400 mt-4">
                Click above to access the Canvas Editor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
