import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ResponsiveActionPanel } from '@/components/ui/responsive-action-panel';
import { GenerateLinkDialog } from './GenerateLinkDialog';
import { isValidCPF, isValidCNPJ, formatCPF, formatCNPJ, formatPhone, formatCEP } from '@/lib/validators';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Document validation (required unless foreign payment)
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
  
  // Financial responsible CPF validation
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

interface AddPatientPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PatientFormData) => Promise<void>;
  onGenerateLink: () => Promise<string>;
}

export function AddPatientPanel({ open, onOpenChange, onSubmit, onGenerateLink }: AddPatientPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

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
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
      toast.success('Paciente cadastrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao cadastrar paciente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const link = await onGenerateLink();
      setGeneratedLink(link);
      setShowLinkDialog(true);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const formatDocument = (value: string) => {
    if (watchType === 'pf') {
      return formatCPF(value);
    }
    return formatCNPJ(value);
  };

  return (
    <>
      <ResponsiveActionPanel
        open={open}
        onOpenChange={onOpenChange}
        title="Novo Paciente"
        description="Cadastre um novo paciente ou gere um link para auto-cadastro"
        submitLabel="Cadastrar"
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={isSubmitting}
        isDirty={form.formState.isDirty}
      >
        <div className="space-y-6">
          {/* Generate Link Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGenerateLink}
            disabled={isGeneratingLink}
          >
            {isGeneratingLink ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Gerar link para paciente preencher
          </Button>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-4">Ou preencha o cadastro manualmente:</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
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
                <RadioGroupItem value="pf" id="type-pf" />
                <Label htmlFor="type-pf" className="font-normal cursor-pointer">Pessoa Física</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pj" id="type-pj" />
                <Label htmlFor="type-pj" className="font-normal cursor-pointer">Empresa</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Foreign Payment */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isForeignPayment"
              checked={watchIsForeignPayment}
              onCheckedChange={(checked) => form.setValue('isForeignPayment', !!checked)}
            />
            <Label htmlFor="isForeignPayment" className="font-normal cursor-pointer">
              Pagamento vem do exterior
            </Label>
          </div>

          {/* Document (CPF/CNPJ) */}
          <div className="space-y-2">
            <Label htmlFor="document">{watchType === 'pf' ? 'CPF' : 'CNPJ'} {!watchIsForeignPayment && '*'}</Label>
            <Input
              id="document"
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
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
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
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
          <Collapsible open={addressOpen} onOpenChange={setAddressOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <span className="text-sm font-medium">Endereço (opcional)</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", addressOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* CEP */}
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
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
                <Label htmlFor="address">Rua</Label>
                <Input id="address" {...form.register('address')} placeholder="Rua, Avenida..." />
              </div>

              {/* Number and Complement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" {...form.register('number')} placeholder="123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input id="complement" {...form.register('complement')} placeholder="Apto, Sala..." />
                </div>
              </div>

              {/* Neighborhood */}
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" {...form.register('neighborhood')} placeholder="Bairro" />
              </div>

              {/* City and State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" {...form.register('city')} placeholder="Cidade" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" {...form.register('state')} placeholder="UF" maxLength={2} />
                </div>
              </div>

              {/* Financial Responsible */}
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasFinancialResponsible"
                    checked={watchHasFinancialResponsible}
                    onCheckedChange={(checked) => form.setValue('hasFinancialResponsible', !!checked)}
                  />
                  <Label htmlFor="hasFinancialResponsible" className="font-normal cursor-pointer">
                    Tem responsável financeiro?
                  </Label>
                </div>

                {watchHasFinancialResponsible && (
                  <div className="space-y-2">
                    <Label htmlFor="financialResponsibleCpf">CPF do Responsável *</Label>
                    <Input
                      id="financialResponsibleCpf"
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
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ResponsiveActionPanel>

      <GenerateLinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        link={generatedLink}
      />
    </>
  );
}
