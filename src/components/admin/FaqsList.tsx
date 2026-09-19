"use client";

import { useState, useTransition } from "react";
import { updateFaq, deleteFaq, createFaq } from "@/app/admin/(panel)/faqs/actions";

type Faq = {
  id: string;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
};

export function FaqsList({ faqs }: { faqs: Faq[] }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pregunta: "", respuesta: "" });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createFaq(formData);
      setForm({ pregunta: "", respuesta: "" });
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta FAQ?")) return;
    startTransition(async () => {
      await deleteFaq(id);
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="accent-btn rounded px-4 py-2 text-xs font-medium"
        >
          {showForm ? "Cancelar" : "+ Nueva FAQ"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded border border-border bg-surface p-4 space-y-3">
          <input
            name="pregunta"
            value={form.pregunta}
            onChange={(e) => setForm({ ...form, pregunta: e.target.value })}
            placeholder="Pregunta"
            required
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <textarea
            name="respuesta"
            value={form.respuesta}
            onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
            placeholder="Respuesta"
            required
            rows={3}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            name="orden"
            type="hidden"
            value={faqs.length}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button type="submit" disabled={isPending} className="accent-btn rounded px-4 py-2 text-xs font-medium">
            Crear
          </button>
        </form>
      )}

      <div className="rounded border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 section-label text-ink/40">Orden</th>
                <th className="px-4 py-3 section-label text-ink/40">Pregunta</th>
                <th className="px-4 py-3 section-label text-ink/40">Respuesta</th>
                <th className="px-4 py-3 section-label text-ink/40">Activo</th>
                <th className="px-4 py-3 section-label text-ink/40">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink/40">{f.orden}</td>
                  <td className="max-w-xs px-4 py-3 font-medium line-clamp-1">{f.pregunta}</td>
                  <td className="max-w-xs px-4 py-3 text-ink/60 line-clamp-2">{f.respuesta}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startTransition(async () => {
                        const formData = new FormData();
                        formData.set("activo", String(!f.activo));
                        await updateFaq(f.id, formData);
                      })}
                      disabled={isPending}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        f.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {f.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink/30">
                    No hay FAQs aun
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
