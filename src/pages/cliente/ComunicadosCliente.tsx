import { ComunicadosClienteList } from '@/components/comunicados/ComunicadosClienteList';

export default function ComunicadosCliente() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Comunicados</h1>
        <p className="text-muted-foreground mt-2">
          Veja os comunicados enviados pelo seu contador
        </p>
      </div>
      <ComunicadosClienteList />
    </div>
  );
}
