import { getEventosCalendario, getObrasParaCalendario } from "./actions";
import { AdminCalendarioGrid } from "@/components/admin/AdminCalendario";

export const dynamic = "force-dynamic";

export default async function AdminCalendarioPage() {
  const [eventos, obras] = await Promise.all([
    getEventosCalendario(),
    getObrasParaCalendario(),
  ]);

  return <AdminCalendarioGrid eventos={eventos} obras={obras} />;
}
