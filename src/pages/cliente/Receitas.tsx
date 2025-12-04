import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChargesList } from '@/components/cliente/receitas/ChargesList';
import { useChargesData } from '@/hooks/cliente/useChargesData';

export default function Receitas() {
  const [searchQuery, setSearchQuery] = useState('');
  const { charges } = useChargesData();

  const filteredCharges = charges.filter((charge) => {
    const query = searchQuery.toLowerCase();
    return (
      charge.patientName.toLowerCase().includes(query) ||
      charge.description.toLowerCase().includes(query) ||
      charge.value.toString().includes(query)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Botão Nova Cobrança */}
      <div className="flex justify-start">
        <Button>
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
    </div>
  );
}
