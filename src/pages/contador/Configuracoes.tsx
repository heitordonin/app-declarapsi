import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { ObrigacoesList } from "@/components/obrigacoes/ObrigacoesList";
import { AddObrigacaoDialog } from "@/components/obrigacoes/AddObrigacaoDialog";
import { EditObrigacaoDialog } from "@/components/obrigacoes/EditObrigacaoDialog";
import { VinculosList } from "@/components/vinculos/VinculosList";
import { AddVinculoDialog } from "@/components/vinculos/AddVinculoDialog";
import { EditVinculoDialog } from "@/components/vinculos/EditVinculoDialog";
import { Obligation } from "@/types/database";
import { VinculoWithRelations } from "@/types/vinculos";

export default function Configuracoes() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedObrigacao, setSelectedObrigacao] = useState<Obligation | null>(null);
  
  const [addVinculoDialogOpen, setAddVinculoDialogOpen] = useState(false);
  const [editVinculoDialogOpen, setEditVinculoDialogOpen] = useState(false);
  const [selectedVinculo, setSelectedVinculo] = useState<VinculoWithRelations | null>(null);

  const handleEdit = (obrigacao: Obligation) => {
    setSelectedObrigacao(obrigacao);
    setEditDialogOpen(true);
  };

  const handleEditVinculo = (vinculo: VinculoWithRelations) => {
    setSelectedVinculo(vinculo);
    setEditVinculoDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie obrigações e vínculos com clientes.</p>
      </div>

      <Tabs defaultValue="obrigacoes" className="w-full">
        <TabsList>
          <TabsTrigger value="obrigacoes">Obrigações</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
        </TabsList>

        <TabsContent value="obrigacoes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Catálogo de Obrigações</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie o catálogo de obrigações fiscais da sua organização
              </p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Obrigação
            </Button>
          </div>

          <ObrigacoesList onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="vinculos" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Vínculos Cliente-Obrigação</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie quais obrigações estão associadas a cada cliente
              </p>
            </div>
            <Button onClick={() => setAddVinculoDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Vínculo
            </Button>
          </div>

          <VinculosList onEdit={handleEditVinculo} />
        </TabsContent>
      </Tabs>

      <AddObrigacaoDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditObrigacaoDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        obrigacao={selectedObrigacao}
      />
      
      <AddVinculoDialog open={addVinculoDialogOpen} onOpenChange={setAddVinculoDialogOpen} />
      <EditVinculoDialog 
        open={editVinculoDialogOpen} 
        onOpenChange={setEditVinculoDialogOpen}
        vinculo={selectedVinculo}
      />
    </div>
  );
}
