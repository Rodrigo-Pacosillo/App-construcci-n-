"use client";

import { MessageCircle } from "lucide-react";

import { WHATSAPP_NUMERO } from "@/lib/constants";

export function WhatsAppFloat() {
  const telefono = WHATSAPP_NUMERO;
  const mensaje = "Hola, quiero consultar por una construcción";
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg transition-all hover:scale-105 hover:shadow-xl md:bottom-8 md:right-8"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-white" />
    </a>
  );
}