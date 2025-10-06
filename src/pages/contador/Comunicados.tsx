import { ComunicadosList } from '@/components/comunicados/ComunicadosList';

export default function Comunicados() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Comunicados</h1>
        <p className="text-muted-foreground mt-2">
          Envie comunicados para seus clientes através da plataforma
        </p>
      </div>
      <ComunicadosList />
    </div>
  );
}
