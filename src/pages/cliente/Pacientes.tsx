import { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientsList } from '@/components/cliente/pacientes/PatientsList';
import { PatientDetails } from '@/components/cliente/pacientes/PatientDetails';
import { usePatientsData } from '@/hooks/cliente/usePatientsData';

export default function Pacientes() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { patients } = usePatientsData();
  
  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.cpf.includes(searchQuery.replace(/\D/g, ''))
    );
  });
  
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] p-4 md:p-6">
      {/* Header com botão */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-foreground">Pacientes</h1>
        <Button onClick={() => console.log('Add new patient')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Lista de Pacientes - Lado Esquerdo */}
        <div className="w-full md:w-[35%] lg:w-[30%]">
          <PatientsList
            patients={filteredPatients}
            selectedId={selectedPatientId}
            onSelect={setSelectedPatientId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        
        {/* Detalhes do Paciente - Lado Direito */}
        <div className="hidden md:flex md:w-[65%] lg:w-[70%]">
          {selectedPatient ? (
            <div className="w-full">
              <PatientDetails patient={selectedPatient} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-50" />
              <p>Selecione um paciente para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
