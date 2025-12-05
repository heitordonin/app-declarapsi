import { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientsList } from '@/components/cliente/pacientes/PatientsList';
import { PatientDetails } from '@/components/cliente/pacientes/PatientDetails';
import { PatientDetailsMobileHeader } from '@/components/cliente/pacientes/PatientDetailsMobileHeader';
import { AddPatientPanel } from '@/components/cliente/pacientes/AddPatientPanel';
import { usePatientsData, PatientDisplayModel } from '@/hooks/cliente/usePatientsData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Pacientes() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'details'>('list');
  const [showAddPanel, setShowAddPanel] = useState(false);
  
  const { patients, isLoading, createPatient, generateInviteLink } = usePatientsData();
  const isMobile = useIsMobile();
  
  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.cpf.includes(searchQuery.replace(/\D/g, ''))
    );
  });
  
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    if (isMobile) {
      setMobileView('details');
    }
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const handleCreatePatient = async (data: any) => {
    await createPatient(data);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header - hidden on mobile when viewing details */}
      <div className={cn(
        "flex items-center justify-between p-4 md:p-6 pb-0 md:pb-0",
        mobileView === 'details' && isMobile && "hidden"
      )}>
        <h1 className="text-xl font-semibold text-foreground">Pacientes</h1>
        <Button onClick={() => setShowAddPanel(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-1 gap-4 p-4 md:p-6 min-h-0">
        {/* Lista de Pacientes - Lado Esquerdo */}
        <div className="w-[35%] lg:w-[30%]">
          <PatientsList
            patients={filteredPatients}
            selectedId={selectedPatientId}
            onSelect={setSelectedPatientId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        
        {/* Detalhes do Paciente - Lado Direito */}
        <div className="flex w-[65%] lg:w-[70%]">
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

      {/* Mobile View with Slide Animation */}
      <div className="md:hidden flex-1 overflow-hidden">
        <div 
          className={cn(
            "flex w-[200%] h-full transition-transform duration-300 ease-in-out",
            mobileView === 'details' ? "-translate-x-1/2" : "translate-x-0"
          )}
        >
          {/* Lista - Screen 1 */}
          <div className="w-1/2 h-full p-4">
            <PatientsList
              patients={filteredPatients}
              selectedId={selectedPatientId}
              onSelect={handleSelectPatient}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          
          {/* Detalhes - Screen 2 */}
          <div className="w-1/2 h-full flex flex-col">
            {selectedPatient ? (
              <>
                <PatientDetailsMobileHeader 
                  patientName={selectedPatient.name}
                  onBack={handleBackToList}
                  onEdit={() => console.log('Edit patient')}
                />
                <div className="flex-1 overflow-y-auto p-4">
                  <PatientDetails patient={selectedPatient} isMobile />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <Users className="h-16 w-16 mb-4 opacity-50" />
                <p>Selecione um paciente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Patient Panel */}
      <AddPatientPanel
        open={showAddPanel}
        onOpenChange={setShowAddPanel}
        onSubmit={handleCreatePatient}
        onGenerateLink={generateInviteLink}
      />
    </div>
  );
}
