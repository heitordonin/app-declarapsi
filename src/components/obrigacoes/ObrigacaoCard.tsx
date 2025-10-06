import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Archive } from "lucide-react";
import { Obligation } from "@/types/database";
import { getFrequencyLabel, getFrequencyColor } from "@/lib/frequency-utils";
import { useState } from "react";

interface ObrigacaoCardProps {
  obrigacao: Obligation;
  onEdit: (obrigacao: Obligation) => void;
  onArchive: (obrigacao: Obligation) => void;
}

export function ObrigacaoCard({ obrigacao, onEdit, onArchive }: ObrigacaoCardProps) {
  const [showFullNotes, setShowFullNotes] = useState(false);
  const notesPreview = obrigacao.notes && obrigacao.notes.length > 100 
    ? obrigacao.notes.substring(0, 100) + "..." 
    : obrigacao.notes;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{obrigacao.name}</CardTitle>
          <Badge className={getFrequencyColor(obrigacao.frequency)}>
            {getFrequencyLabel(obrigacao.frequency)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="text-sm">
          <span className="font-medium text-muted-foreground">Meta Interna:</span>{" "}
          <span className="text-foreground">Dia {obrigacao.internal_target_day}</span>
        </div>
        
        {obrigacao.legal_due_rule && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Vencimento Legal:</span>{" "}
            <span className="text-foreground">Dia {obrigacao.legal_due_rule}</span>
          </div>
        )}
        
        {obrigacao.notes && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">Observações:</span>{" "}
            <span className="text-foreground">
              {showFullNotes ? obrigacao.notes : notesPreview}
              {obrigacao.notes.length > 100 && (
                <button 
                  onClick={() => setShowFullNotes(!showFullNotes)}
                  className="text-primary hover:underline ml-1"
                >
                  {showFullNotes ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(obrigacao)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onArchive(obrigacao)}
          className="flex-1"
        >
          <Archive className="h-4 w-4 mr-1" />
          Arquivar
        </Button>
      </CardFooter>
    </Card>
  );
}
