import { DocumentosTable } from "@/components/protocolos/DocumentosTable";

export default function Protocolos() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Protocolos</h1>
        <p className="text-muted-foreground">
          Documentos enviados aos clientes.
        </p>
      </div>

      <DocumentosTable />
    </div>
  );
}
