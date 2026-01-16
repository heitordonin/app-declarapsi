import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveActionPanel } from '@/components/ui/responsive-action-panel';
import { useExpenseCategories } from '@/hooks/cliente/useExpenseCategories';
import { formatCurrencyForInput } from '@/lib/expense-utils';
import type { Expense, ExpenseFormData } from '@/hooks/cliente/useExpensesData';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const expenseSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  value: z.string().min(1, 'Valor é obrigatório'),
  paymentDate: z.string().min(1, 'Data de pagamento é obrigatória'),
  penalty: z.string().optional(),
  description: z.string().optional(),
  isResidentialExpense: z.boolean().default(false),
  competencyMonth: z.number().optional(),
  competencyYear: z.number().optional(),
});

interface EditExpensePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  onSubmit: (id: string, data: ExpenseFormData) => Promise<void>;
}

export function EditExpensePanel({ open, onOpenChange, expense, onSubmit }: EditExpensePanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories, isLoading: isCategoriesLoading } = useExpenseCategories();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: '',
      value: '',
      paymentDate: '',
      penalty: '',
      description: '',
      isResidentialExpense: false,
      competencyMonth: new Date().getMonth() + 1,
      competencyYear: currentYear,
    },
  });

  const watchCategoryId = form.watch('categoryId');
  const watchIsResidentialExpense = form.watch('isResidentialExpense');

  const selectedCategory = categories.find(c => c.id === watchCategoryId);
  const showResidentialSection = selectedCategory?.isResidential === true;
  const showCompetencyFields = selectedCategory?.requiresCompetency === true;

  // Populate form when expense changes
  useEffect(() => {
    if (expense && categories.length > 0) {
      // Find category by id or name
      const category = categories.find(c => c.id === expense.categoryId) || 
                       categories.find(c => c.name === expense.category);
      
      form.reset({
        categoryId: category?.id || expense.categoryId || '',
        value: formatCurrencyForInput(expense.originalValue),
        paymentDate: expense.paymentDate,
        penalty: expense.penalty ? formatCurrencyForInput(expense.penalty) : '',
        description: expense.description || '',
        isResidentialExpense: expense.isResidentialExpense || false,
        competencyMonth: expense.competencyMonth || new Date().getMonth() + 1,
        competencyYear: expense.competencyYear || currentYear,
      });
    }
  }, [expense, categories, form]);

  // Reset residential checkbox when category changes
  useEffect(() => {
    if (!showResidentialSection) {
      form.setValue('isResidentialExpense', false);
    }
  }, [showResidentialSection, form]);

  const handleSubmit = async (data: ExpenseFormData) => {
    if (!expense) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(expense.id, data);
      form.reset();
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <ResponsiveActionPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Despesa"
      description="Atualize os dados da despesa"
      submitLabel="Salvar Alterações"
      onSubmit={form.handleSubmit(handleSubmit)}
      isSubmitting={isSubmitting}
      isDirty={form.formState.isDirty}
    >
      <div className="space-y-6">
        {/* Categoria */}
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria *</Label>
          <Select
            value={watchCategoryId}
            onValueChange={(value) => form.setValue('categoryId', value)}
            disabled={isCategoriesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.categoryId && (
            <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
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

        {/* Data do Pagamento */}
        <div className="space-y-2">
          <Label htmlFor="paymentDate">Data do Pagamento *</Label>
          <DatePicker
            date={form.watch('paymentDate') ? parse(form.watch('paymentDate'), 'yyyy-MM-dd', new Date()) : undefined}
            onDateChange={(date) => {
              if (date) {
                form.setValue('paymentDate', format(date, 'yyyy-MM-dd'), { shouldDirty: true });
              }
            }}
            placeholder="Selecione uma data"
          />
          {form.formState.errors.paymentDate && (
            <p className="text-sm text-destructive">{form.formState.errors.paymentDate.message}</p>
          )}
        </div>

        {/* Multa/Juros */}
        <div className="space-y-2">
          <Label htmlFor="penalty">Multa/Juros (R$)</Label>
          <CurrencyInput
            id="penalty"
            value={form.watch('penalty') || ''}
            onValueChange={(values) => {
              form.setValue('penalty', values.formattedValue, { shouldDirty: true });
            }}
            placeholder="0,00"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Observações sobre esta despesa..."
            rows={3}
          />
        </div>

        {/* Seção Residencial - Condicional */}
        {showResidentialSection && (
          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isResidentialExpense"
                checked={watchIsResidentialExpense}
                onCheckedChange={(checked) => form.setValue('isResidentialExpense', !!checked)}
              />
              <Label htmlFor="isResidentialExpense" className="font-normal cursor-pointer">
                Esta é uma despesa residencial
              </Label>
            </div>

            {watchIsResidentialExpense && (
              <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-900">
                Se marcado, será calculado 20% do valor como ajuste residencial. 
                Apenas este percentual será considerado como despesa dedutível.
              </p>
            )}
          </div>
        )}

        {/* Seção Competência - Condicional */}
        {showCompetencyFields && (
          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
            <Label className="text-sm font-medium">Competência *</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="competencyMonth" className="text-xs text-muted-foreground">Mês</Label>
                <Select
                  value={form.watch('competencyMonth')?.toString()}
                  onValueChange={(value) => form.setValue('competencyMonth', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="competencyYear" className="text-xs text-muted-foreground">Ano</Label>
                <Select
                  value={form.watch('competencyYear')?.toString()}
                  onValueChange={(value) => form.setValue('competencyYear', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveActionPanel>
  );
}
