import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveActionPanel } from '@/components/ui/responsive-action-panel';
import { StandardDescriptionsDialog } from './StandardDescriptionsDialog';
import { isValidCPF, formatCPF } from '@/lib/validators';
import type { Patient } from '@/hooks/cliente/usePatientsData';
import type { ChargeFormData } from '@/hooks/cliente/useChargesData';

const chargeSchema = z.object({
  patientId: z.string().min(1, 'Paciente é obrigatório'),
  isPatientPayer: z.string().min(1),
  payerCpf: z.string().optional(),
  dueDate: z.date({ required_error: 'Vencimento é obrigatório' }),
  description: z.string().min(1, 'Descrição é obrigatória'),
  value: z.string().min(1, 'Valor é obrigatório'),
  sessionsCount: z.number().min(1, 'Mínimo de 1 consulta').max(99, 'Máximo de 99 consultas'),
}).superRefine((data, ctx) => {
  if (data.isPatientPayer === 'no') {
    if (!data.payerCpf || data.payerCpf.replace(/\D/g, '').length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF do responsável é obrigatório',
        path: ['payerCpf'],
      });
    } else if (!isValidCPF(data.payerCpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF inválido',
        path: ['payerCpf'],
      });
    }
  }
});

type FormValues = z.infer<typeof chargeSchema>;

interface AddChargePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ChargeFormData) => Promise<void>;
  patients: Patient[];
  isLoadingPatients?: boolean;
}

export function AddChargePanel({ 
  open, 
  onOpenChange, 
  onSubmit, 
  patients,
  isLoadingPatients 
}: AddChargePanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpfInputValue, setCpfInputValue] = useState('');
  const [showDescriptionsDialog, setShowDescriptionsDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      patientId: '',
      isPatientPayer: 'yes',
      payerCpf: '',
      description: '',
      value: '',
      sessionsCount: 1,
    },
  });

  const watchPatientId = form.watch('patientId');
  const watchIsPatientPayer = form.watch('isPatientPayer');

  const selectedPatient = patients.find(p => p.id === watchPatientId);

  // When patient changes or when "no" is selected, pre-fill CPF if available
  useEffect(() => {
    if (watchIsPatientPayer === 'no' && selectedPatient) {
      if (selectedPatient.has_financial_responsible && selectedPatient.financial_responsible_cpf) {
        const formattedCpf = formatCPF(selectedPatient.financial_responsible_cpf);
        setCpfInputValue(formattedCpf);
        form.setValue('payerCpf', formattedCpf);
      } else {
        setCpfInputValue('');
        form.setValue('payerCpf', '');
      }
    }
  }, [watchPatientId, watchIsPatientPayer, selectedPatient, form]);

  // Reset CPF when switching to "yes"
  useEffect(() => {
    if (watchIsPatientPayer === 'yes') {
      setCpfInputValue('');
      form.setValue('payerCpf', '');
    }
  }, [watchIsPatientPayer, form]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCPF(value);
    setCpfInputValue(formatted);
    form.setValue('payerCpf', formatted, { shouldDirty: true });
  };

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Get patient CPF from selected patient
      const patientCpf = selectedPatient?.document || '';
      
      await onSubmit({
        patientId: data.patientId,
        patientCpf,
        isPatientPayer: data.isPatientPayer === 'yes',
        payerCpf: data.isPatientPayer === 'no' ? data.payerCpf : undefined,
        dueDate: data.dueDate,
        description: data.description,
        value: data.value,
        sessionsCount: data.sessionsCount,
      });
      form.reset();
      setCpfInputValue('');
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setCpfInputValue('');
    }
    onOpenChange(newOpen);
  };

  return (
    <ResponsiveActionPanel
      open={open}
      onOpenChange={handleOpenChange}
      title="Nova Cobrança"
      description="Registre uma nova cobrança para um paciente"
      submitLabel="Salvar"
      onSubmit={form.handleSubmit(handleSubmit)}
      isSubmitting={isSubmitting}
      isDirty={form.formState.isDirty}
    >
      <div className="space-y-6">
        {/* Paciente */}
        <div className="space-y-2">
          <Label htmlFor="patientId">Paciente *</Label>
          <Select
            value={watchPatientId}
            onValueChange={(value) => form.setValue('patientId', value, { shouldDirty: true })}
            disabled={isLoadingPatients}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.patientId && (
            <p className="text-sm text-destructive">{form.formState.errors.patientId.message}</p>
          )}
        </div>

        {/* Paciente é o titular do pagamento? */}
        <div className="space-y-3">
          <Label>Paciente é o titular do pagamento? *</Label>
          <RadioGroup
            value={watchIsPatientPayer}
            onValueChange={(value) => form.setValue('isPatientPayer', value, { shouldDirty: true })}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="payer-yes" />
              <Label htmlFor="payer-yes" className="font-normal cursor-pointer">
                Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="payer-no" />
              <Label htmlFor="payer-no" className="font-normal cursor-pointer">
                Não
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* CPF do Responsável - Condicional */}
        {watchIsPatientPayer === 'no' && (
          <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
            <Label htmlFor="payerCpf">CPF do Responsável *</Label>
            <Input
              id="payerCpf"
              value={cpfInputValue}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            {selectedPatient?.has_financial_responsible && selectedPatient?.financial_responsible_cpf && (
              <p className="text-xs text-muted-foreground">
                💡 CPF pré-preenchido do cadastro do paciente
              </p>
            )}
            {form.formState.errors.payerCpf && (
              <p className="text-sm text-destructive">{form.formState.errors.payerCpf.message}</p>
            )}
          </div>
        )}

        {/* Vencimento */}
        <div className="space-y-2">
          <Label>Vencimento *</Label>
          <DatePicker
            date={form.watch('dueDate')}
            onDateChange={(date) => date && form.setValue('dueDate', date, { shouldDirty: true })}
            placeholder="Selecione uma data"
          />
          {form.formState.errors.dueDate && (
            <p className="text-sm text-destructive">{form.formState.errors.dueDate.message}</p>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <div className="flex gap-2">
            <Input
              id="description"
              {...form.register('description')}
              placeholder="Ex: Consulta individual"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowDescriptionsDialog(true)}
              title="Descrições padrão"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
          {form.formState.errors.description && (
            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="value">Valor (R$) *</Label>
          <CurrencyInput
            id="value"
            value={form.watch('value') || ''}
            onValueChange={(values) => {
              form.setValue('value', values.formattedValue, { shouldDirty: true });
            }}
            placeholder="0,00"
          />
          {form.formState.errors.value && (
            <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>
          )}
        </div>

        {/* Quantidade de Consultas */}
        <div className="space-y-2">
          <Label>Referente a quantas consultas? *</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const current = form.watch('sessionsCount') || 1;
                if (current > 1) {
                  form.setValue('sessionsCount', current - 1, { shouldDirty: true });
                }
              }}
              disabled={form.watch('sessionsCount') <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min={1}
              max={99}
              className="w-20 text-center"
              value={form.watch('sessionsCount') || 1}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                const clamped = Math.min(99, Math.max(1, value));
                form.setValue('sessionsCount', clamped, { shouldDirty: true });
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const current = form.watch('sessionsCount') || 1;
                if (current < 99) {
                  form.setValue('sessionsCount', current + 1, { shouldDirty: true });
                }
              }}
              disabled={form.watch('sessionsCount') >= 99}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.formState.errors.sessionsCount && (
            <p className="text-sm text-destructive">{form.formState.errors.sessionsCount.message}</p>
          )}
        </div>
      </div>

      <StandardDescriptionsDialog
        open={showDescriptionsDialog}
        onOpenChange={setShowDescriptionsDialog}
        onSelect={(description) => {
          form.setValue('description', description, { shouldDirty: true });
        }}
      />
    </ResponsiveActionPanel>
  );
}
