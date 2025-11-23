import { Handle, Position } from "@xyflow/react";

export const StartNode = () => {
    return (
        <div className="bg-background-light dark:bg-background-dark rounded-xl shadow-lg border border-zinc-200 dark:border-[#23482f] w-64">
            <div className="flex items-center gap-3 p-4">
                <div className="bg-primary text-[#112217] flex items-center justify-center rounded-lg shrink-0 size-10">
                    <span className="material-symbols-outlined">flag</span>
                </div>
                <div>
                    <p className="font-bold text-zinc-900 dark:text-white">Start Flow</p>
                    <p className="text-xs text-zinc-500 dark:text-gray-400">Entry point</p>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
        </div>
    );
};
