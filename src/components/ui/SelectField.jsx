import { ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const SelectField = ({
    label,
    value,
    onChange,
    options,
    disabled,
    placeholder = "Select option",
}) => {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const selected = options.find((o) => o.value === value)

    return (
        <div className="space-y-2" ref={ref}>
            <label className="text-sm text-muted-foreground">
                {label}
            </label>

            <div className="relative">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-left shadow-sm transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                    <span className={selected ? "" : "text-muted-foreground"}>
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""
                            }`}
                    />
                </button>

                {open && !disabled && (
                    <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in zoom-in-95">

                        {options.length === 0 && (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                                No options available
                            </div>
                        )}

                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value)
                                    setOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-muted ${option.value === value ? "bg-muted" : ""
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SelectField
