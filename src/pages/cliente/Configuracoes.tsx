import { Mail, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const reminderOptions = [
  { value: '0', label: 'No dia' },
  { value: '1', label: '1 dia antes' },
  { value: '2', label: '2 dias antes' },
  { value: '5', label: '5 dias antes' },
];

export default function Configuracoes() {
  const handleFeatureClick = () => {
    toast({
      title: 'Em breve',
      description: 'Esta funcionalidade estará disponível em breve.',
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      
      <div className="space-y-4">
        {/* Email Reminders */}
        <Card className="opacity-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Lembretes por E-mail</CardTitle>
            </div>
            <CardDescription>
              Configure lembretes automáticos por e-mail antes das consultas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div onClick={handleFeatureClick} className="cursor-pointer">
                <Switch
                  checked={false}
                  disabled
                  id="email-enabled"
                />
              </div>
              <Label htmlFor="email-enabled" className="font-medium text-muted-foreground">
                Desativado
              </Label>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-muted-foreground min-w-[80px]">Lembrete 1</Label>
                <Select value="0" disabled>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-muted-foreground min-w-[80px]">Lembrete 2</Label>
                <Select value="1" disabled>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Reminders */}
        <Card className="opacity-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Lembretes por WhatsApp</CardTitle>
            </div>
            <CardDescription>
              Configure lembretes automáticos por WhatsApp antes das consultas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div onClick={handleFeatureClick} className="cursor-pointer">
                <Switch
                  checked={false}
                  disabled
                  id="whatsapp-enabled"
                />
              </div>
              <Label htmlFor="whatsapp-enabled" className="font-medium text-muted-foreground">
                Desativado
              </Label>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-muted-foreground min-w-[80px]">Lembrete 1</Label>
                <Select value="0" disabled>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-muted-foreground min-w-[80px]">Lembrete 2</Label>
                <Select value="1" disabled>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
