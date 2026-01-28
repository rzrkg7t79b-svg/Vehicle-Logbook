import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/20 text-primary shadow-[0_0_8px_rgba(255,102,0,0.2)]",
        secondary:
          "border-white/[0.08] bg-white/[0.06] text-white/80 backdrop-blur-sm",
        destructive:
          "border-red-500/30 bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]",
        outline:
          "border-white/[0.12] bg-transparent text-white/70",
        success:
          "border-green-500/30 bg-green-500/20 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.2)]",
        warning:
          "border-orange-500/30 bg-orange-500/20 text-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
