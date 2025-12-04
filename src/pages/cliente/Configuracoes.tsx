import { useState } from 'react';
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
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailReminder1, setEmailReminder1] = useState('0');
  const [emailReminder2, setEmailReminder2] = useState('1');
  
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappReminder1, setWhatsappReminder1] = useState('0');
  const [whatsappReminder2, setWhatsappReminder2] = useState('1');

  const handleEmailToggle = (checked: boolean) => {
    setEmailEnabled(checked);
    toast({
      title: checked ? 'Lembretes por e-mail ativados' : 'Lembretes por e-mail desativados',
      description: 'Configuração salva com sucesso.',
    });
  };

  const handleWhatsappToggle = (checked: boolean) => {
    setWhatsappEnabled(checked);
    toast({
      title: checked ? 'Lembretes por WhatsApp ativados' : 'Lembretes por WhatsApp desativados',
      description: 'Configuração salva com sucesso.',
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      
      <div className="space-y-4">
        {/* Email Reminders */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Lembretes por E-mail</CardTitle>
            </div>
            <CardDescription>
              Configure lembretes automáticos por e-mail antes das consultas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={emailEnabled}
                onCheckedChange={handleEmailToggle}
                id="email-enabled"
              />
              <Label htmlFor="email-enabled" className="font-medium">
                Ativado
              </Label>
            </div>
            
            {emailEnabled && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Label className="text-muted-foreground min-w-[80px]">Lembrete 1</Label>
                  <Select value={emailReminder1} onValueChange={setEmailReminder1}>
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
                  <Select value={emailReminder2} onValueChange={setEmailReminder2}>
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
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Reminders */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Lembretes por WhatsApp</CardTitle>
            </div>
            <CardDescription>
              Configure lembretes automáticos por WhatsApp antes das consultas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={whatsappEnabled}
                onCheckedChange={handleWhatsappToggle}
                id="whatsapp-enabled"
              />
              <Label htmlFor="whatsapp-enabled" className="font-medium">
                Ativado
              </Label>
            </div>
            
            {whatsappEnabled && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Label className="text-muted-foreground min-w-[80px]">Lembrete 1</Label>
                  <Select value={whatsappReminder1} onValueChange={setWhatsappReminder1}>
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
                  <Select value={whatsappReminder2} onValueChange={setWhatsappReminder2}>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
