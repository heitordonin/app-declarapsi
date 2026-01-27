import { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientsList } from '@/components/cliente/pacientes/PatientsList';
import { PatientDetails } from '@/components/cliente/pacientes/PatientDetails';
import { PatientDetailsMobileHeader } from '@/components/cliente/pacientes/PatientDetailsMobileHeader';
import { AddPatientPanel } from '@/components/cliente/pacientes/AddPatientPanel';
import { EditPatientPanel } from '@/components/cliente/pacientes/EditPatientPanel';
import { AddChargePanel } from '@/components/cliente/receitas/AddChargePanel';
import { usePatientsData, Patient } from '@/hooks/cliente/usePatientsData';
import { useChargesData, ChargeFormData } from '@/hooks/cliente/useChargesData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Pacientes() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'details'>('list');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showAddChargePanel, setShowAddChargePanel] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  const { patients, rawPatients, isLoading, createPatient, updatePatient, generateInviteLink } = usePatientsData();
  const { createCharge } = useChargesData();
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

  const handleEditPatient = () => {
    const rawPatient = rawPatients.find(p => p.id === selectedPatientId);
    if (rawPatient) {
      setEditingPatient(rawPatient);
      setShowEditPanel(true);
    }
  };

  const handleUpdatePatient = async (id: string, data: any) => {
    await updatePatient({ id, data });
  };

  const handleAddCharge = () => {
    setShowAddChargePanel(true);
  };

  const handleCreateCharge = async (data: ChargeFormData) => {
    await createCharge(data);
    setShowAddChargePanel(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header - hidden on mobile when viewing details */}
      <div className={cn(
        "flex items-center justify-between p-4 md:p-6 pb-0 md:pb-0",
        mobileView === 'details' && isMobile && "hidden"
      )}>
        <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
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
              <PatientDetails patient={selectedPatient} onEdit={handleEditPatient} onAddCharge={handleAddCharge} />
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
                  onEdit={handleEditPatient}
                />
                <div className="flex-1 overflow-y-auto p-4">
                  <PatientDetails patient={selectedPatient} isMobile onAddCharge={handleAddCharge} />
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

      {/* Edit Patient Panel */}
      <EditPatientPanel
        open={showEditPanel}
        onOpenChange={setShowEditPanel}
        patient={editingPatient}
        onSubmit={handleUpdatePatient}
      />

      {/* Add Charge Panel */}
      <AddChargePanel
        open={showAddChargePanel}
        onOpenChange={setShowAddChargePanel}
        onSubmit={handleCreateCharge}
        patients={rawPatients}
        defaultPatientId={selectedPatientId}
      />
    </div>
  );
}
