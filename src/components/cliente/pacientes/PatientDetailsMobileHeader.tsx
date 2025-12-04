import { ArrowLeft, Pencil } from 'lucide-react';

interface PatientDetailsMobileHeaderProps {
  patientName: string;
  onBack: () => void;
  onEdit?: () => void;
}

export function PatientDetailsMobileHeader({ 
  patientName, 
  onBack, 
  onEdit 
}: PatientDetailsMobileHeaderProps) {
  return (
    <div className="bg-primary text-primary-foreground flex items-center justify-between px-4 py-3">
      <button 
        onClick={onBack}
        className="p-1 hover:opacity-80 transition-opacity"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      
      <h2 className="font-semibold text-lg truncate max-w-[60%]">
        {patientName}
      </h2>
      
      {onEdit ? (
        <button 
          onClick={onEdit}
          className="p-1 hover:opacity-80 transition-opacity"
          aria-label="Editar"
        >
          <Pencil className="h-5 w-5" />
        </button>
      ) : (
        <div className="w-7" /> // Spacer for alignment
      )}
    </div>
  );
}
