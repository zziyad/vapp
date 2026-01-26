import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'

export function Select({ value, onValueChange, children, ...props }) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} {...props}>
      {children}
    </SelectPrimitive.Root>
  )
}

export function SelectTrigger({ className = '', children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      className={cn('border rounded-md px-3 py-2 h-10 inline-flex items-center justify-between w-full', className)}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  )
}

export function SelectValue(props) {
  return <SelectPrimitive.Value {...props} />
}

export function SelectContent({ className = '', children, position = 'popper', ...props }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={4}
        className={cn('z-50 rounded-md border bg-white shadow-md max-h-[300px] overflow-hidden', className)}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1 max-h-[300px] overflow-y-auto">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ className = '', children, ...props }) {
  return (
    <SelectPrimitive.Item
      className={cn('relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-gray-100', className)}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
