import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientDisplayModel } from '@/hooks/cliente/usePatientsData';
import { PatientBasicInfo } from './PatientBasicInfo';
import { PatientFinancialSummary } from './PatientFinancialSummary';
import { PatientCharges } from './PatientCharges';

interface PatientDetailsProps {
  patient: PatientDisplayModel;
  onEdit?: () => void;
  isMobile?: boolean;
}

function formatCPF(cpf: string): string {
  if (!cpf) return 'Não informado';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function PatientDetails({ patient, onEdit, isMobile }: PatientDetailsProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - hidden on mobile (uses PatientDetailsMobileHeader instead) */}
      {!isMobile && (
        <div className="flex items-center justify-between pb-4 border-b mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{patient.name}</h2>
            <p className="text-sm text-muted-foreground">
              CPF: {formatCPF(patient.cpf)}
            </p>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Info Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PatientBasicInfo patient={patient} />
          <PatientFinancialSummary patient={patient} />
        </div>

        {/* Charges Tables */}
        <PatientCharges
          charges={patient.pendingCharges}
          type="pending"
          onAddNew={() => console.log('Add new charge')}
        />
        
        <PatientCharges
          charges={patient.receivedCharges}
          type="received"
        />
      </div>
    </div>
  );
}
