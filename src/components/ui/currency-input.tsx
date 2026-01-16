import { forwardRef } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<NumericFormatProps, 'customInput'> {
  className?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <NumericFormat
        getInputRef={ref}
        customInput={Input}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
        autoComplete="off"
        inputMode="decimal"
        className={cn(className)}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
