import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Popover } from './Popover';
import { Calendar } from './Calendar';

interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          variant="secondary"
          size="sm"
          className={cn('justify-start text-left font-normal', className)}
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
  );
}
