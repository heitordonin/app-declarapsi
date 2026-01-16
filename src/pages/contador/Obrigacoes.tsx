import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ObrigacoesCalendar } from '@/components/obrigacoes/ObrigacoesCalendar';
import { ObrigacoesInstancesList } from '@/components/obrigacoes/ObrigacoesInstancesList';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ObligationStatus } from '@/lib/obligation-status-utils';

export default function Obrigacoes() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: allInstances } = useQuery({
    queryKey: ['calendar-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obligation_instances')
        .select('internal_target_at, status');

      if (error) throw error;
      return data;
    },
  });

  const instancesByDate: Record<string, ObligationStatus[]> = {};
  allInstances?.forEach((instance) => {
    const dateStr = instance.internal_target_at;
    if (!instancesByDate[dateStr]) {
      instancesByDate[dateStr] = [];
    }
    instancesByDate[dateStr].push(instance.status as ObligationStatus);
  });

  // Mutation para gerar instâncias
  const generateInstancesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-obligation-instances');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Instâncias geradas com sucesso",
        description: `${data.instancesCreated || 0} instâncias foram criadas.`,
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-instances'] });
      queryClient.invalidateQueries({ queryKey: ['obligation-instances'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar instâncias",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Obrigações</h1>
        
        <div className="space-y-6">
          <div className="w-full">
            <ObrigacoesCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              instancesByDate={instancesByDate}
            />
          </div>
          
          <div className="w-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {selectedDate
                    ? `Obrigações - ${selectedDate.toLocaleDateString('pt-BR')}`
                    : 'Todas as Obrigações'}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate(undefined)}
                      className="text-sm text-primary hover:underline"
                    >
                      Limpar filtro
                    </button>
                  )}
                  <Button
                    onClick={() => generateInstancesMutation.mutate()}
                    disabled={generateInstancesMutation.isPending}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${generateInstancesMutation.isPending ? 'animate-spin' : ''}`} />
                    Gerar Instâncias
                  </Button>
                </div>
              </div>
              <ObrigacoesInstancesList selectedDate={selectedDate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
