import * as React from"react"

import { cn } from"@/lib/utils"

const Table = React.forwardRef<
 HTMLTableElement,
 React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
 <div className="relative w-full overflow-auto">
 <table
 ref={ref}
 className={cn("w-full caption-bottom text-sm", className)}
 {...props}
 />
 </div>
))
Table.displayName ="Table"

const TableHeader = React.forwardRef<
 HTMLTableSectionElement,
 React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
 <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName ="TableHeader"

const TableBody = React.forwardRef<
 HTMLTableSectionElement,
 React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
 <tbody
 ref={ref}
 className={cn("[&_tr:last-child]:border-0", className)}
 {...props}
 />
))
TableBody.displayName ="TableBody"

const TableFooter = React.forwardRef<
 HTMLTableSectionElement,
 React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
 <tfoot
 ref={ref}
 className={cn(
"border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
 className
 )}
 {...props}
 />
))
TableFooter.displayName ="TableFooter"

import { motion } from "framer-motion";

const TableRow = React.forwardRef<
 HTMLTableRowElement,
 React.HTMLAttributes<HTMLTableRowElement> & { id?: string }
>(({ className, id, ...props }, ref) => {
 const generatedId = React.useId().replace(/:/g, '');
 return (
 <motion.tr
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.2 }}
 ref={ref as any}
 id={id || `tr-${generatedId}`}
 className={cn(
"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
 className
 )}
 {...props}
 />
 )
})
TableRow.displayName ="TableRow"

const TableHead = React.forwardRef<
 HTMLTableCellElement,
 React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, id, ...props }, ref) => {
 const generatedId = React.useId().replace(/:/g, '');
 return (
 <th
 ref={ref}
 id={id || `th-${generatedId}`}
 className={cn(
"h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
 className
 )}
 {...props}
 />
 )
})
TableHead.displayName ="TableHead"

const TableCell = React.forwardRef<
 HTMLTableCellElement,
 React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, id, ...props }, ref) => {
 const generatedId = React.useId().replace(/:/g, '');
 return (
 <td
 ref={ref}
 id={id || `td-${generatedId}`}
 className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
 {...props}
 />
 )
})
TableCell.displayName ="TableCell"

const TableCaption = React.forwardRef<
 HTMLTableCaptionElement,
 React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
 <caption
 ref={ref}
 className={cn("mt-4 text-sm text-muted-foreground", className)}
 {...props}
 />
))
TableCaption.displayName ="TableCaption"

export {
 Table,
 TableHeader,
 TableBody,
 TableFooter,
 TableHead,
 TableRow,
 TableCell,
 TableCaption,
}
