
"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone } from "lucide-react";

type PhoneInputProps = {
  countryCode: string;
  onCountryCodeChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  placeholder?: string;
};

// A simplified list of countries for the selector
const countries = [
  { code: '91', name: 'India', flag: '🇮🇳' },
  { code: '1', name: 'USA', flag: '🇺🇸' },
  { code: '44', name: 'UK', flag: '🇬🇧' },
  { code: '61', name: 'Australia', flag: '🇦🇺' },
  { code: '971', name: 'UAE', flag: '🇦🇪' },
];

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  placeholder,
}: PhoneInputProps) {
  return (
    <div className="relative mt-2 flex items-center">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <Select value={countryCode} onValueChange={onCountryCodeChange}>
          <SelectTrigger className="w-[80px] border-none bg-transparent focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} +{c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        type="tel"
        id="phone"
        name="phone"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className="pl-[100px]"
        placeholder={placeholder}
        required
      />
    </div>
  );
}
