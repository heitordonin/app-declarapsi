import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChargesList } from '@/components/cliente/receitas/ChargesList';
import { AddChargePanel } from '@/components/cliente/receitas/AddChargePanel';
import { useChargesData, ChargeFormData } from '@/hooks/cliente/useChargesData';
import { usePatientsData } from '@/hooks/cliente/usePatientsData';
import { toast } from 'sonner';

export default function Receitas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  
  const { rawPatients, isLoading: isLoadingPatients } = usePatientsData();
  const { charges, createCharge, isLoading } = useChargesData();

  const filteredCharges = charges.filter((charge) => {
    const query = searchQuery.toLowerCase();
    return (
      charge.patient_name.toLowerCase().includes(query) ||
      charge.description.toLowerCase().includes(query) ||
      charge.amount.toString().includes(query)
    );
  });

  const handleCreateCharge = async (data: ChargeFormData) => {
    await createCharge(data);
    setShowAddPanel(false);
    toast.success('Cobrança registrada com sucesso!');
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Botão Nova Cobrança */}
      <div className="flex justify-start">
        <Button onClick={() => setShowAddPanel(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, descrição ou valor..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="md:w-auto w-full">
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Filtros avançados</span>
          <span className="md:hidden">Filtros</span>
        </Button>
      </div>

      {/* Lista de Cobranças */}
      <ChargesList charges={filteredCharges} />

      {/* Painel de Nova Cobrança */}
      <AddChargePanel
        open={showAddPanel}
        onOpenChange={setShowAddPanel}
        onSubmit={handleCreateCharge}
        patients={rawPatients}
        isLoadingPatients={isLoadingPatients}
      />
    </div>
  );
}
