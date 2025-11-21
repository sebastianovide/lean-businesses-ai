"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SavedCanvases: React.FC = () => {
  const router = useRouter();
  const [savedCanvases, setSavedCanvases] = React.useState<
    { id: string; name: string; createdAt: string; updatedAt: string }[]
  >([]);

  React.useEffect(() => {
    const loadCanvases = () => {
      try {
        const indexJson = localStorage.getItem("lean-canvases-index");
        if (indexJson) {
          const canvases = JSON.parse(indexJson);
          // Sort by updated at desc
          canvases.sort(
            (a: any, b: any) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setSavedCanvases(canvases);
        }
      } catch (err) {
        console.error("Failed to load saved canvases:", err);
      }
    };

    loadCanvases();

    // Listen for storage events to update list if changed in another tab
    window.addEventListener("storage", loadCanvases);
    return () => window.removeEventListener("storage", loadCanvases);
  }, []);

  const handleDelete = (id: string) => {
    // if (!confirm("Are you sure you want to delete this canvas?")) return;

    try {
      // Remove from index
      const newCanvases = savedCanvases.filter((c) => c.id !== id);
      localStorage.setItem("lean-canvases-index", JSON.stringify(newCanvases));
      setSavedCanvases(newCanvases);

      // Remove data
      localStorage.removeItem(`lean-canvas-${id}`);
      localStorage.removeItem(`lean-canvas-name-${id}`);
    } catch (err) {
      console.error("Failed to delete canvas:", err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button variant="link" className="p-0" onClick={() => router.back()}>
            ← Back
          </Button>
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
              <Button
                asChild
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Link href="/canvas">Create Your First Canvas</Link>
              </Button>
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
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>
                          ID:{" "}
                          <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                            {canvas.id}
                          </span>
                        </p>
                        <p>Created: {formatDate(canvas.createdAt)}</p>
                        <p>Updated: {formatDate(canvas.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        asChild
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all"
                      >
                        <Link href={`/canvas?canvasId=${canvas.id}`}>Open</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow transition-all"
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete your canvas "{canvas.name}" and
                              its chat history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(canvas.id)}
                              className="bg-rose-600 hover:bg-rose-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
