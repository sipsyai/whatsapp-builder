import { Handle, Position } from "@xyflow/react";
import type { NodeData } from "../../../shared/types";

export const MessageNode = ({ data }: { data: NodeData }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark rounded-xl shadow-lg border border-zinc-200 dark:border-[#23482f] w-64 group hover:ring-2 hover:ring-primary transition-all">
            <Handle type="target" position={Position.Left} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
            <div className="flex items-start gap-3 p-4">
                <div className="bg-blue-500 text-white flex items-center justify-center rounded-lg shrink-0 size-10">
                    <span className="material-symbols-outlined">chat</span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-zinc-900 dark:text-white truncate">{data.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-gray-400 truncate">{data.content || "Click to configure"}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }} className="text-zinc-400 hover:text-white">
                        <span className="material-symbols-outlined text-lg">settings</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }} className="text-zinc-400 hover:text-red-500">
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
        </div>
    );
};
