import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import { Input } from "./Input";

interface InputPasswordProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  className?: string;
  showPasswordClassName?: string;
}

const InputPassword = React.forwardRef<HTMLInputElement, InputPasswordProps>(
  ({ className, showPasswordClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn(className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={cn(
            "absolute right-3 cursor-pointer top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none",
            showPasswordClassName
          )}
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeIcon className="size-4" />
          ) : (
            <EyeOffIcon className="size-4" />
          )}
        </button>
      </div>
    );
  }
);

InputPassword.displayName = "InputPassword";

export { InputPassword };
