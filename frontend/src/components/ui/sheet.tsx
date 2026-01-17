import * as React from 'react';
import { cn } from '../../lib/utils';

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined);

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Sheet = ({ open: controlledOpen, onOpenChange, children }: SheetProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error('SheetTrigger must be used within Sheet');

  return (
    <button
      ref={ref}
      className={className}
      onClick={() => context.setOpen(true)}
      {...props}
    />
  );
});
SheetTrigger.displayName = 'SheetTrigger';

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'left' | 'right' | 'top' | 'bottom' }
>(({ className, side = 'right', children, ...props }, ref) => {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error('SheetContent must be used within Sheet');

  if (!context.open) return null;

  const sideClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => context.setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          'fixed z-50 bg-background p-6 shadow-lg transition-transform',
          sideClasses[side],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  )
);
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
SheetDescription.displayName = 'SheetDescription';

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription };
