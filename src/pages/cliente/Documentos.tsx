import { FileText } from 'lucide-react';

export default function Documentos() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Documentos</h1>
      <p className="text-muted-foreground text-center">
        Esta página está sendo desenvolvida.
      </p>
    </div>
  );
}
