import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onChange, onCheckedChange, ...props }, ref) => {
  const handleChange = (e) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    } else if (onChange) {
      onChange(e);
    }
  };

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={handleChange}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "appearance-none",
          "checked:bg-primary checked:text-primary-foreground",
          className
        )}
        {...props}
      />
      {checked && (
        <Check className="absolute left-0 h-4 w-4 text-primary-foreground pointer-events-none" />
      )}
    </label>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
