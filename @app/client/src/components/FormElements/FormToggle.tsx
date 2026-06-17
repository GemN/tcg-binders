import type { FC } from "react";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/Form.tsx";
import { Switch, type SwitchProps } from "@/components/ui/Switch.tsx";

interface FormToggleProps {
  label?: string;
  description?: string;
  value: SwitchProps["checked"];
  onChange: SwitchProps["onCheckedChange"];
}

export const FormToggle: FC<FormToggleProps> = ({
  label,
  description,
  value,
  onChange,
}) => {
  return (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">{label}</FormLabel>
        <FormDescription>{description}</FormDescription>
      </div>
      <FormControl>
        <Switch checked={value} onCheckedChange={onChange} />
      </FormControl>
    </FormItem>
  );
};
