"use client";

import { useEffect, useState } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [mesageError, setMesageError] = useState(error.message);

  useEffect(() => {
    console.error("Error capturado por error.tsx:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 p-6">
      <div className="text-center max-w-md">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Ocurrió un error inesperado
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {mesageError}
          </p>
          <button
            onClick={() => {
              setMesageError(error.message);
              reset();
            }}
            className="w-full bg-gradient-to-br from-amber-500 to-orange-600 text-white py-3 rounded-xl shadow-md hover:from-amber-600 hover:to-orange-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
