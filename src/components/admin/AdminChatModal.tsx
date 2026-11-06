"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";

interface AdminChatModalProps {
  sessionId: string;
  onClose: () => void;
}

export function AdminChatModal({ sessionId, onClose }: AdminChatModalProps) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="absolute top-4 right-4 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-background hover:bg-ink/90 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div
        className="relative w-full max-w-5xl h-full bg-background rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
          <ChatPanel esAdmin={true} initialSessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
