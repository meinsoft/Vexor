import { cn } from "@/lib/utils";

function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-xl border border-vexor-border bg-[#141414] px-4 py-3 text-sm text-vexor-text outline-none transition placeholder:text-[#484F58] focus:border-white focus:ring-4 focus:ring-white/10",
        className
      )}
      {...props}
    />
  );
}

export { Input };
