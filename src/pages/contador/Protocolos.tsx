import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusCard } from "@/components/protocolos/StatusCard";
import { ProtocolosTable } from "@/components/protocolos/ProtocolosTable";
import { AlertCircle, Clock, CheckCircle2, FileText } from "lucide-react";

export default function Protocolos() {
  const { data: stats } = useQuery({
    queryKey: ["protocols-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obligation_instances")
        .select("status");

      if (error) throw error;

      const pending = data?.filter((i) => i.status === "pending").length || 0;
      const due48h = data?.filter((i) => i.status === "due_48h").length || 0;
      const overdue = data?.filter((i) => i.status === "overdue").length || 0;
      const completed = data?.filter((i) => i.status === "on_time_done" || i.status === "late_done").length || 0;

      return { pending, due48h, overdue, completed };
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Protocolos</h1>
        <p className="text-muted-foreground">
          Acompanhe o status das obrigações e gerencie os prazos.
        </p>
      </div>

      {/* Cards de Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Vencidos"
          count={stats?.overdue || 0}
          icon={AlertCircle}
          variant="danger"
        />
        <StatusCard
          title="Vence em 48h"
          count={stats?.due48h || 0}
          icon={Clock}
          variant="warning"
        />
        <StatusCard
          title="Pendentes"
          count={stats?.pending || 0}
          icon={FileText}
          variant="default"
        />
        <StatusCard
          title="Concluídos"
          count={stats?.completed || 0}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Tabela de Instâncias */}
      <ProtocolosTable />
    </div>
  );
}
