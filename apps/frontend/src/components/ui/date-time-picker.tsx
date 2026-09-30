"use client"

import * as React from "react"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: string // Формат: "YYYY-MM-DDTHH:mm"
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  error?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Выберите дату и время",
  error,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Парсим значение из формата "YYYY-MM-DDTHH:mm"
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return undefined
      return date
    } catch {
      return undefined
    }
  }, [value])

  // Обработчик выбора даты
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    // Форматируем в формат datetime-local: "YYYY-MM-DDTHH:mm"
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const datetimeString = `${year}-${month}-${day}T${hours}:${minutes}`

    onChange?.(datetimeString)
  }

  // Форматируем дату для отображения
  const displayValue = React.useMemo(() => {
    if (!dateValue) return null
    return format(dateValue, "PPP", { locale: ru })
  }, [dateValue])

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !dateValue && "text-muted-foreground",
              error && "border-red-500"
            )}
            disabled={disabled}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || placeholder}
            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date) {
                handleDateSelect(date)
              }
            }}
            captionLayout="dropdown"
            locale={ru}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

