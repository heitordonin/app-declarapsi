import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const form = useForm<FormValues>({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      patientId: '',
      isPatientPayer: 'yes',
      payerCpf: '',
      description: '',
      value: '',
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
          <Input
            id="description"
            {...form.register('description')}
            placeholder="Ex: Consulta individual"
          />
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
      </div>
    </ResponsiveActionPanel>
  );
}
