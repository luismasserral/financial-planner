import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Popover } from './Popover';
import { Calendar } from './Calendar';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  label?: string;
}

export function DatePicker({ value, onChange, className, label }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setOpen(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={
          <Button
            variant="secondary"
            size="sm"
            className="justify-start text-left font-normal w-full"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(value, 'dd/MM/yyyy')}
          </Button>
        }
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          defaultMonth={value}
          initialFocus
        />
      </Popover>
    </div>
  );
}
