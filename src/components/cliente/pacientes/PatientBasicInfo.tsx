import { Mail, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/hooks/cliente/usePatientsData';

interface PatientBasicInfoProps {
  patient: Patient;
}

export function PatientBasicInfo({ patient }: PatientBasicInfoProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Informações Básicas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{patient.email}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">
            {patient.phone || 'Não informado'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">
            {patient.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
          </span>
        </div>

        {patient.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {patient.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
