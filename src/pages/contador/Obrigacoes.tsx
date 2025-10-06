import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ObrigacoesCalendar } from '@/components/obrigacoes/ObrigacoesCalendar';
import { ObrigacoesInstancesList } from '@/components/obrigacoes/ObrigacoesInstancesList';
import { ObrigacoesList } from '@/components/obrigacoes/ObrigacoesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ObligationStatus } from '@/lib/obligation-status-utils';

export default function Obrigacoes() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: allInstances } = useQuery({
    queryKey: ['calendar-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligation_instances')
        .select('due_at, status');

      if (error) throw error;
      return data;
    },
  });

  const instancesByDate: Record<string, ObligationStatus[]> = {};
  allInstances?.forEach((instance) => {
    const dateStr = instance.due_at;
    if (!instancesByDate[dateStr]) {
      instancesByDate[dateStr] = [];
    }
    instancesByDate[dateStr].push(instance.status as ObligationStatus);
  });

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Obrigações</h1>
        
        <Tabs defaultValue="calendario" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendario">Calendário & Instâncias</TabsTrigger>
            <TabsTrigger value="cadastro">Cadastro de Obrigações</TabsTrigger>
          </TabsList>

          <TabsContent value="calendario">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-1">
                <ObrigacoesCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  instancesByDate={instancesByDate}
                />
              </div>
              
              <div className="lg:col-span-1 min-w-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {selectedDate
                        ? `Obrigações - ${selectedDate.toLocaleDateString('pt-BR')}`
                        : 'Todas as Obrigações'}
                    </h2>
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate(undefined)}
                        className="text-sm text-primary hover:underline"
                      >
                        Limpar filtro
                      </button>
                    )}
                  </div>
                  <ObrigacoesInstancesList selectedDate={selectedDate} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cadastro">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Gerencie as obrigações fiscais que serão vinculadas aos clientes.
              </p>
              <ObrigacoesList onEdit={() => {}} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
