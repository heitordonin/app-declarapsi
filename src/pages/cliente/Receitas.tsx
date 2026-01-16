import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChargesList } from '@/components/cliente/receitas/ChargesList';
import { AddChargePanel } from '@/components/cliente/receitas/AddChargePanel';
import { EditChargePanel } from '@/components/cliente/receitas/EditChargePanel';
import { MarkAsPaidDialog } from '@/components/cliente/receitas/MarkAsPaidDialog';
import { ChargeFilters, ChargeFiltersValues, initialChargeFilters } from '@/components/cliente/receitas/ChargeFilters';
import { useChargesData, ChargeFormData, ChargeEditData, Charge } from '@/hooks/cliente/useChargesData';
import { usePatientsData } from '@/hooks/cliente/usePatientsData';
import { toast } from 'sonner';

// Helper to parse currency string to number
const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

export default function Receitas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ChargeFiltersValues>(initialChargeFilters);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [chargeToPay, setChargeToPay] = useState<Charge | null>(null);
  
  const { rawPatients, isLoading: isLoadingPatients } = usePatientsData();
  const { charges, createCharge, updateCharge, markAsPaid, deleteCharge, isLoading } = useChargesData();

  // Apply all filters
  const filteredCharges = charges.filter((charge) => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      charge.patient_name.toLowerCase().includes(query) ||
      charge.description.toLowerCase().includes(query) ||
      charge.amount.toString().includes(query);

    if (!matchesSearch) return false;

    // Due date range filter
    if (filters.dueDateStart) {
      const chargeDate = new Date(charge.due_date);
      const startDate = new Date(filters.dueDateStart);
      if (chargeDate < startDate) return false;
    }

    if (filters.dueDateEnd) {
      const chargeDate = new Date(charge.due_date);
      const endDate = new Date(filters.dueDateEnd);
      if (chargeDate > endDate) return false;
    }

    // Value range filter
    if (filters.valueMin) {
      const minValue = parseCurrencyToNumber(filters.valueMin);
      if (charge.amount < minValue) return false;
    }

    if (filters.valueMax) {
      const maxValue = parseCurrencyToNumber(filters.valueMax);
      if (charge.amount > maxValue) return false;
    }

    // Status filter
    if (filters.status && charge.status !== filters.status) {
      return false;
    }

    // Patient filter
    if (filters.patientId && charge.patient_id !== filters.patientId) {
      return false;
    }

    return true;
  });

  const handleCreateCharge = async (data: ChargeFormData) => {
    await createCharge(data);
    setShowAddPanel(false);
    toast.success('Cobrança registrada com sucesso!');
  };

  const handleUpdateCharge = async (chargeId: string, data: ChargeEditData) => {
    await updateCharge(chargeId, data);
    setShowEditPanel(false);
    setEditingCharge(null);
    toast.success('Cobrança atualizada com sucesso!');
  };

  const handleMarkAsPaid = async (chargeId: string, paymentDate: Date) => {
    await markAsPaid(chargeId, paymentDate);
    toast.success('Pagamento registrado com sucesso!');
  };

  const handleDeleteCharge = async (chargeId: string) => {
    await deleteCharge(chargeId);
  };

  const handleClearFilters = () => {
    setFilters(initialChargeFilters);
  };

  const openEditPanel = (charge: Charge) => {
    setEditingCharge(charge);
    setShowEditPanel(true);
  };

  const openPayDialog = (charge: Charge) => {
    setChargeToPay(charge);
    setShowPayDialog(true);
  };

  // Prepare patients list for filters
  const patientsForFilters = rawPatients.map(p => ({ id: p.id, name: p.name }));

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
        <ChargeFilters
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          patients={patientsForFilters}
        />
      </div>

      {/* Lista de Cobranças */}
      <ChargesList 
        charges={filteredCharges}
        onMarkAsPaid={openPayDialog}
        onEdit={openEditPanel}
        onDelete={handleDeleteCharge}
      />

      {/* Painel de Nova Cobrança */}
      <AddChargePanel
        open={showAddPanel}
        onOpenChange={setShowAddPanel}
        onSubmit={handleCreateCharge}
        patients={rawPatients}
        isLoadingPatients={isLoadingPatients}
      />

      {/* Painel de Edição */}
      <EditChargePanel
        open={showEditPanel}
        onOpenChange={setShowEditPanel}
        onSubmit={handleUpdateCharge}
        charge={editingCharge}
        patients={rawPatients}
        isLoadingPatients={isLoadingPatients}
      />

      {/* Dialog Marcar como Pago */}
      <MarkAsPaidDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        charge={chargeToPay}
        onConfirm={handleMarkAsPaid}
      />
    </div>
  );
}
