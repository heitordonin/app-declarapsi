import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { EmptyState } from '../EmptyState';
import { PatientDisplayModel } from '@/hooks/cliente/usePatientsData';
import { cn } from '@/lib/utils';

interface PatientsListProps {
  patients: PatientDisplayModel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function formatCPF(cpf: string): string {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function PatientsList({
  patients,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}: PatientsListProps) {
  return (
    <Card className="h-full flex flex-col p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum paciente"
            description="Adicione seu primeiro paciente."
            className="py-8"
          />
        ) : (
          patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => onSelect(patient.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors',
                'hover:bg-muted/50',
                selectedId === patient.id
                  ? 'border-l-4 border-l-primary bg-primary/5 border-primary/20'
                  : 'border-border'
              )}
            >
              <p className="font-medium text-foreground">{patient.name}</p>
              <p className="text-sm text-muted-foreground">
                {patient.cpf ? `CPF: ${formatCPF(patient.cpf)}` : 'CPF: Não informado'}
              </p>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}
