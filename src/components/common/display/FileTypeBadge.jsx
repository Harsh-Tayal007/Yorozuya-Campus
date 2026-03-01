import { FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const FILE_TYPE_STYLES = {
    pdf: {
        label: "PDF",
        icon: FileText,
        tooltip: "PDF document",
        badgeClass:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
}

const FileTypeBadge = ({ fileType = "pdf", onPreview }) => {
    const type =
        FILE_TYPE_STYLES[fileType?.toLowerCase()] || FILE_TYPE_STYLES.pdf
    const Icon = type.icon

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onPreview}
                        className="flex items-center gap-2 focus:outline-none"
                    >
                        <Icon className="h-5 w-5 text-muted-foreground hover:text-foreground transition" />

                        <Badge
                            variant="secondary"
                            className={`text-xs px-2 py-0.5 ${type.badgeClass}`}
                        >
                            {type.label}
                        </Badge>
                    </button>
                </TooltipTrigger>

                <TooltipContent>
                    <p>{type.tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default FileTypeBadge
