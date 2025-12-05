import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ResponsiveActionPanel } from '@/components/ui/responsive-action-panel';
import { isValidCPF, isValidCNPJ, formatCPF, formatCNPJ, formatPhone, formatCEP } from '@/lib/validators';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Patient } from '@/hooks/cliente/usePatientsData';

const patientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum(['pf', 'pj']),
  isForeignPayment: z.boolean(),
  document: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  hasFinancialResponsible: z.boolean(),
  financialResponsibleCpf: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.isForeignPayment) {
    if (!data.document || data.document.replace(/\D/g, '').length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: data.type === 'pf' ? 'CPF é obrigatório' : 'CNPJ é obrigatório',
        path: ['document'],
      });
    } else if (data.type === 'pf' && !isValidCPF(data.document)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF inválido',
        path: ['document'],
      });
    } else if (data.type === 'pj' && !isValidCNPJ(data.document)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CNPJ inválido',
        path: ['document'],
      });
    }
  }
  
  if (data.hasFinancialResponsible) {
    if (!data.financialResponsibleCpf || data.financialResponsibleCpf.replace(/\D/g, '').length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF do responsável é obrigatório',
        path: ['financialResponsibleCpf'],
      });
    } else if (!isValidCPF(data.financialResponsibleCpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF do responsável inválido',
        path: ['financialResponsibleCpf'],
      });
    }
  }
});

type PatientFormData = z.infer<typeof patientSchema>;

interface EditPatientPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  onSubmit: (id: string, data: PatientFormData) => Promise<void>;
}

function patientToFormData(patient: Patient): PatientFormData {
  return {
    name: patient.name,
    type: patient.type,
    isForeignPayment: patient.is_foreign_payment,
    document: patient.document 
      ? (patient.type === 'pf' ? formatCPF(patient.document) : formatCNPJ(patient.document))
      : '',
    email: patient.email,
    phone: formatPhone(patient.phone),
    cep: patient.cep ? formatCEP(patient.cep) : '',
    address: patient.address || '',
    number: patient.number || '',
    complement: patient.complement || '',
    neighborhood: patient.neighborhood || '',
    city: patient.city || '',
    state: patient.state || '',
    hasFinancialResponsible: patient.has_financial_responsible,
    financialResponsibleCpf: patient.financial_responsible_cpf 
      ? formatCPF(patient.financial_responsible_cpf) 
      : '',
  };
}

export function EditPatientPanel({ open, onOpenChange, patient, onSubmit }: EditPatientPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const addressSectionRef = useRef<HTMLDivElement>(null);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      type: 'pf',
      isForeignPayment: false,
      document: '',
      email: '',
      phone: '',
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      hasFinancialResponsible: false,
      financialResponsibleCpf: '',
    },
  });

  const watchType = form.watch('type');
  const watchIsForeignPayment = form.watch('isForeignPayment');
  const watchHasFinancialResponsible = form.watch('hasFinancialResponsible');

  // Load patient data when patient changes
  useEffect(() => {
    if (patient && open) {
      const formData = patientToFormData(patient);
      form.reset(formData);
      // Open address section if patient has address data
      if (patient.cep || patient.address || patient.city) {
        setAddressOpen(true);
      }
    }
  }, [patient, open, form]);

  // Reset document when foreign payment changes
  useEffect(() => {
    if (watchIsForeignPayment) {
      form.setValue('document', '');
    }
  }, [watchIsForeignPayment, form]);

  const handleCepBlur = async () => {
    const cep = form.getValues('cep')?.replace(/\D/g, '');
    if (cep?.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('address', data.logradouro || '');
        form.setValue('neighborhood', data.bairro || '');
        form.setValue('city', data.localidade || '');
        form.setValue('state', data.uf || '');
        form.setValue('complement', data.complemento || '');
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleSubmit = async (data: PatientFormData) => {
    if (!patient) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(patient.id, data);
      onOpenChange(false);
      toast.success('Paciente atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar paciente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDocument = (value: string) => {
    if (watchType === 'pf') {
      return formatCPF(value);
    }
    return formatCNPJ(value);
  };

  return (
    <ResponsiveActionPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Paciente"
      description="Atualize as informações do paciente"
      submitLabel="Salvar Alterações"
      onSubmit={form.handleSubmit(handleSubmit)}
      isSubmitting={isSubmitting}
      isDirty={form.formState.isDirty}
    >
      <div className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="edit-name">Nome completo *</Label>
          <Input
            id="edit-name"
            {...form.register('name')}
            placeholder="Nome do paciente"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Tipo de cadastro *</Label>
          <RadioGroup
            value={watchType}
            onValueChange={(value: 'pf' | 'pj') => form.setValue('type', value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pf" id="edit-type-pf" />
              <Label htmlFor="edit-type-pf" className="font-normal cursor-pointer">Pessoa Física</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pj" id="edit-type-pj" />
              <Label htmlFor="edit-type-pj" className="font-normal cursor-pointer">Empresa</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Foreign Payment */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="edit-isForeignPayment"
            checked={watchIsForeignPayment}
            onCheckedChange={(checked) => form.setValue('isForeignPayment', !!checked)}
          />
          <Label htmlFor="edit-isForeignPayment" className="font-normal cursor-pointer">
            Pagamento vem do exterior
          </Label>
        </div>

        {/* Document (CPF/CNPJ) */}
        <div className="space-y-2">
          <Label htmlFor="edit-document">{watchType === 'pf' ? 'CPF' : 'CNPJ'} {!watchIsForeignPayment && '*'}</Label>
          <Input
            id="edit-document"
            value={form.watch('document') || ''}
            onChange={(e) => form.setValue('document', formatDocument(e.target.value))}
            placeholder={watchType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
            disabled={watchIsForeignPayment}
            maxLength={watchType === 'pf' ? 14 : 18}
          />
          {form.formState.errors.document && (
            <p className="text-sm text-destructive">{form.formState.errors.document.message}</p>
          )}
        </div>

        {/* Financial Responsible */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-hasFinancialResponsible"
              checked={watchHasFinancialResponsible}
              onCheckedChange={(checked) => form.setValue('hasFinancialResponsible', !!checked)}
            />
            <Label htmlFor="edit-hasFinancialResponsible" className="font-normal cursor-pointer">
              Tem responsável financeiro?
            </Label>
          </div>

          {watchHasFinancialResponsible && (
            <div className="space-y-2">
              <Label htmlFor="edit-financialResponsibleCpf">CPF do Responsável *</Label>
              <Input
                id="edit-financialResponsibleCpf"
                value={form.watch('financialResponsibleCpf') || ''}
                onChange={(e) => form.setValue('financialResponsibleCpf', formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {form.formState.errors.financialResponsibleCpf && (
                <p className="text-sm text-destructive">{form.formState.errors.financialResponsibleCpf.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email *</Label>
          <Input
            id="edit-email"
            type="email"
            {...form.register('email')}
            placeholder="email@exemplo.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="edit-phone">Telefone *</Label>
          <Input
            id="edit-phone"
            value={form.watch('phone') || ''}
            onChange={(e) => form.setValue('phone', formatPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>

        {/* Address Section */}
        <Collapsible 
          open={addressOpen} 
          onOpenChange={(open) => {
            setAddressOpen(open);
            if (open) {
              setTimeout(() => {
                addressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          }}
        >
          <div ref={addressSectionRef}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <span className="text-sm font-medium">Endereço (opcional)</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", addressOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* CEP */}
            <div className="space-y-2">
              <Label htmlFor="edit-cep">CEP</Label>
              <div className="relative">
                <Input
                  id="edit-cep"
                  value={form.watch('cep') || ''}
                  onChange={(e) => form.setValue('cep', formatCEP(e.target.value))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {isLoadingCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="edit-address">Rua</Label>
              <Input id="edit-address" {...form.register('address')} placeholder="Rua, Avenida..." />
            </div>

            {/* Number and Complement */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-number">Número</Label>
                <Input id="edit-number" {...form.register('number')} placeholder="123" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-complement">Complemento</Label>
                <Input id="edit-complement" {...form.register('complement')} placeholder="Apto, Sala..." />
              </div>
            </div>

            {/* Neighborhood */}
            <div className="space-y-2">
              <Label htmlFor="edit-neighborhood">Bairro</Label>
              <Input id="edit-neighborhood" {...form.register('neighborhood')} placeholder="Bairro" />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">Cidade</Label>
                <Input id="edit-city" {...form.register('city')} placeholder="Cidade" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">Estado</Label>
                <Input id="edit-state" {...form.register('state')} placeholder="UF" maxLength={2} />
              </div>
            </div>

          </CollapsibleContent>
        </Collapsible>
      </div>
    </ResponsiveActionPanel>
  );
}
