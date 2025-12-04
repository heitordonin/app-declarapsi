import { useState } from 'react';
import { Users } from 'lucide-react';
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
    <div className="flex h-[calc(100vh-5rem)] gap-4 p-4 md:p-6">
      {/* Lista de Pacientes - Lado Esquerdo */}
      <div className="w-full md:w-1/3 lg:w-1/4">
        <PatientsList
          patients={filteredPatients}
          selectedId={selectedPatientId}
          onSelect={setSelectedPatientId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={() => console.log('Add new patient')}
        />
      </div>
      
      {/* Detalhes do Paciente - Lado Direito */}
      <div className="hidden md:flex md:w-2/3 lg:w-3/4">
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
  );
}
