import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from "@/components/ui";

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
        <SelectTrigger className="w-fit bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Выберите валюту" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600">
            {selectCurrency.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
        </SelectContent>
    </Select>
  );
};

