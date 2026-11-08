"use client";

import React from "react";

/**
 * Render minimo y seguro de texto de chat:
 * - `codigo` -> <code className="chat-code">
 * - **negrita** -> <strong>
 * - saltos de linea respetados.
 */
export function RenderTextoChat({ texto }: { texto: string }) {
  const partes = texto.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {partes.map((p, i) => {
        if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
          return (
            <code key={i} className="chat-code">
              {p.slice(1, -1)}
            </code>
          );
        }
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </p>
  );
}
