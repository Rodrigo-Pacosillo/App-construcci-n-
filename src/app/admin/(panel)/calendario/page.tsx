import { getEventosCalendario, getObrasParaCalendario } from "./actions";
import { AdminCalendario } from "@/components/admin/AdminCalendario";

export const dynamic = "force-dynamic";

export default async function AdminCalendarioPage() {
  const [eventos, obras] = await Promise.all([
    getEventosCalendario(),
    getObrasParaCalendario(),
  ]);

  return <AdminCalendario eventos={eventos} obras={obras} />;
}
