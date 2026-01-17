import * as React from 'react';
import { cn } from '../../lib/utils';

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value: controlledValue, onValueChange, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState('');
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
    const handleValueChange = onValueChange || setUncontrolledValue;

    return (
      <RadioGroupContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn('grid gap-2', className)} {...props} />
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    if (!context) throw new Error('RadioGroupItem must be used within RadioGroup');

    return (
      <input
        type="radio"
        ref={ref}
        className={cn('h-4 w-4 border border-primary text-primary focus:ring-2', className)}
        checked={context.value === value}
        onChange={() => context.onValueChange(value)}
        value={value}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
