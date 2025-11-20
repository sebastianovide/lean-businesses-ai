"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex items-center">
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
      <div className="max-w-7xl mx-auto px-4 flex gap-6 w-full">
        {/* Main content (canvas) */}
        <div className="flex-1 min-w-0">
          {/* Navigation */}

          {/* Welcome content */}
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to AI Lean Canvas
              </h2>
              <p className="text-gray-500 mb-4">
                Build and iterate on your business model with AI assistance
              </p>
              <div className="flex justify-center gap-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Link href="/canvas">Start a new Canvas</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-sm hover:shadow-md transition-all"
                >
                  <Link href="/saved">Saved Canvases</Link>
                </Button>
              </div>
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
