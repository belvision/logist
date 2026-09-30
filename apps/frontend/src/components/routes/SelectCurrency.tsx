import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from "@/components/ui/select";

interface SelectCurrencyProps {
    currency: string;
    setCurrency: (value: string) => void;
}

export const SelectCurrency = ({ currency, setCurrency }: SelectCurrencyProps) => {
    const selectCurrency = [
        { value: 'руб.', label: 'руб.' },
        { value: '$', label: '$' },
        { value: '€', label: '€' },
        { value: 'BYN', label: 'BYN' },
      ];
  return (
    <Select
        value={currency}
        onValueChange={(value: string) => setCurrency(value)}
    >
        <SelectTrigger className="w-fit">
            <SelectValue placeholder="Выберите валюту" />
        </SelectTrigger>
        <SelectContent>
            {selectCurrency.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
        </SelectContent>
    </Select>
  );
};

