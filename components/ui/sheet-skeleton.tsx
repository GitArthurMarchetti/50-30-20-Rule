import * as React from "react"

import { SheetFooter, SheetHeader } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import { Skeleton } from "./skeleton"

type SheetSkeletonSection = {
  width?: string
  height?: string
  className?: string
}

interface SheetSkeletonProps {
  header?: SheetSkeletonSection[]
  body?: SheetSkeletonSection[]
  footer?: SheetSkeletonSection[]
  className?: string
  bodyClassName?: string
  disableHeader?: boolean
  disableBody?: boolean
  disableFooter?: boolean
}

const defaultHeader: SheetSkeletonSection[] = [
  { width: "w-24", height: "h-3" },
  { width: "w-3/4", height: "h-6" },
]

const defaultBody: SheetSkeletonSection[] = [
  { width: "w-full", height: "h-4" },
  { width: "w-5/6", height: "h-4" },
  { width: "w-2/3", height: "h-4" },
]

const defaultFooter: SheetSkeletonSection[] = [
  { width: "w-full", height: "h-9" },
]

function renderSkeletons(sections: SheetSkeletonSection[]) {
  return sections.map((section, index) => (
    <Skeleton
      key={index}
      className={cn(
        section.height ?? "h-4",
        section.width ?? "w-full",
        section.className
      )}
    />
  ))
}

function SheetSkeleton({
  header = defaultHeader,
  body = defaultBody,
  footer = defaultFooter,
  className,
  bodyClassName,
  disableHeader,
  disableBody,
  disableFooter,
}: SheetSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {!disableHeader ? (
        <SheetHeader className="gap-3 px-4">
          <div className="flex flex-col gap-2">{renderSkeletons(header)}</div>
        </SheetHeader>
      ) : null}

      {!disableBody ? (
        <div className={cn("flex flex-col gap-3 px-4", bodyClassName)}>
          {renderSkeletons(body)}
        </div>
      ) : null}

      {!disableFooter ? (
        <SheetFooter className="gap-2 px-4">
          {renderSkeletons(footer)}
        </SheetFooter>
      ) : null}
    </div>
  )
}

const SheetSkeletonTitle = React.forwardRef<
  React.ElementRef<typeof Skeleton>,
  React.ComponentProps<typeof Skeleton>
>(({ className, ...props }, ref) => (
  <Skeleton ref={ref} className={cn("h-6 w-1/2", className)} {...props} />
))
SheetSkeletonTitle.displayName = "SheetSkeletonTitle"

const SheetSkeletonDescription = React.forwardRef<
  React.ElementRef<typeof Skeleton>,
  React.ComponentProps<typeof Skeleton>
>(({ className, ...props }, ref) => (
  <Skeleton ref={ref} className={cn("h-4 w-3/4", className)} {...props} />
))
SheetSkeletonDescription.displayName = "SheetSkeletonDescription"

const SheetSkeletonButton = React.forwardRef<
  React.ElementRef<typeof Skeleton>,
  React.ComponentProps<typeof Skeleton>
>(({ className, ...props }, ref) => (
  <Skeleton ref={ref} className={cn("h-9 w-full", className)} {...props} />
))
SheetSkeletonButton.displayName = "SheetSkeletonButton"

export {
  SheetSkeleton,
  SheetSkeletonButton,
  SheetSkeletonDescription,
  SheetSkeletonTitle,
}

