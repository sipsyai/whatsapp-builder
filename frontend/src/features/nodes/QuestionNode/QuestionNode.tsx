import { Handle, Position } from "@xyflow/react";
import type { NodeData } from "../../../shared/types";

export const QuestionNode = ({ data }: { data: NodeData }) => {
    const isButtons = data.questionType === 'buttons';
    const isList = data.questionType === 'list';
    const isBranching = isButtons || isList;

    // Flatten outputs for rendering handles
    let outputs: { id: string, label: string }[] = [];
    if (isButtons && data.buttons) {
        outputs = data.buttons.map((b, i) => ({ id: `btn-${i}`, label: b }));
    } else if (isList && data.listSections) {
        outputs = data.listSections.flatMap(s => s.rows.map(r => ({ id: r.id, label: r.title })));
    }

    // Buttons Specific Style
    if (isButtons) {
        return (
            <div className="bg-[#0D1F12] rounded-2xl border-2 border-[#13ec5b] shadow-lg flex flex-col min-w-[280px]">
                <Handle type="target" position={Position.Left} className="!bg-[#4b5563] !border-[#0D1F12] hover:!bg-[#13ec5b]" style={{ top: 40 }} />

                <div className="flex items-start gap-3 p-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-inner text-white shrink-0">
                        <span className="material-symbols-outlined text-2xl">help</span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="text-white text-lg font-bold leading-tight truncate">Buttons</h3>
                        <p className="text-[#9CA3AF] text-xs font-medium truncate">Click to configure</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }} className="text-gray-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>

                <div className="h-px bg-white/10 w-full"></div>

                <div className="flex flex-col py-4 gap-3 w-full relative">
                    {outputs.map((opt) => (
                        <div key={opt.id} className="relative flex items-center justify-end h-6 pr-4">
                            <span className="text-sm font-medium text-white mr-2 truncate max-w-[180px]">{opt.label}</span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={opt.id}
                                className="!bg-[#4b5563] !border-[#0D1F12] hover:!bg-[#13ec5b]"
                                style={{ top: 'auto', right: -7, transform: 'none', position: 'absolute' }}
                            />
                        </div>
                    ))}
                    {/* Default Handle */}
                    <div className="relative flex items-center justify-end h-6 pr-4 mt-2 border-t border-white/5 pt-2">
                        <span className="text-sm font-medium text-gray-400 mr-2">Default</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="default"
                            className="!bg-[#4b5563] !border-[#0D1F12] hover:!bg-[#13ec5b]"
                            style={{ top: 'auto', right: -7, transform: 'none', position: 'absolute' }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Standard/List Style
    return (
        <div className={`bg-background-light dark:bg-background-dark rounded-xl shadow-lg border border-zinc-200 dark:border-[#23482f] group hover:ring-2 hover:ring-primary transition-all flex flex-col ${isBranching ? 'min-w-[280px]' : 'w-64'}`}>
            <Handle type="target" position={Position.Left} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />

            <div className="flex items-start gap-3 p-4">
                <div className="bg-orange-500 text-white flex items-center justify-center rounded-lg shrink-0 size-10">
                    <span className="material-symbols-outlined">help</span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-zinc-900 dark:text-white truncate">{data.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-gray-400 truncate">{data.content || "Click to configure"}</p>
                    {data.variable && (
                        <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded mt-1 inline-block">
                            @{data.variable}
                        </span>
                    )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }} className="text-zinc-400 hover:text-white">
                    <span className="material-symbols-outlined text-lg">settings</span>
                </button>
            </div>

            {isList && (
                <div className="flex flex-col pb-4 w-full">
                    <div className="h-px bg-zinc-200 dark:bg-[#23482f] w-full mb-2"></div>
                    {outputs.map((opt) => (
                        <div key={opt.id} className="relative flex items-center justify-end h-8 pr-0 group/row">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mr-3 truncate max-w-[180px] group-hover/row:text-primary transition-colors">{opt.label}</span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={opt.id}
                                className="!bg-white dark:!bg-zinc-500 !border-zinc-400 hover:!bg-primary"
                                style={{ top: 'auto', right: -6, transform: 'none', position: 'absolute' }}
                            />
                        </div>
                    ))}
                    {/* Default */}
                    <div className="relative flex items-center justify-end h-8 pr-0 group/row mt-1 border-t border-zinc-200 dark:border-[#23482f] pt-1">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-3">Default</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="default"
                            className="!bg-white dark:!bg-zinc-500 !border-zinc-400 hover:!bg-primary"
                            style={{ top: 'auto', right: -6, transform: 'none', position: 'absolute' }}
                        />
                    </div>
                </div>
            )}

            {/* Standard Text Question Output */}
            {!isBranching && (
                <Handle type="source" position={Position.Right} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
            )}
        </div>
    );
};
