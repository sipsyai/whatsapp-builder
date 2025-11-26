import { Handle, Position } from "@xyflow/react";
import type { NodeData } from "../../../shared/types";

const methodColors: Record<string, string> = {
    GET: "text-green-400",
    POST: "text-blue-400",
    PUT: "text-orange-400",
    DELETE: "text-red-400",
};

export const RestApiNode = ({ data }: { data: NodeData }) => {
    const method = data.apiMethod || 'GET';

    return (
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl shadow-lg border-2 border-cyan-400 min-w-[280px] group hover:ring-2 hover:ring-cyan-300 transition-all">
            <Handle type="target" position={Position.Left} className="!bg-white !border-cyan-400" />

            <div className="flex items-start gap-3 p-4">
                <div className="bg-white/20 text-white flex items-center justify-center rounded-lg shrink-0 size-12">
                    <span className="material-symbols-outlined text-2xl">api</span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-white truncate">{data.label || "REST API"}</p>
                    {data.apiUrl ? (
                        <div className="space-y-1">
                            <p className="text-xs text-white/80 truncate">
                                <span className={`font-bold ${methodColors[method]}`}>{method}</span>
                                {' '}{data.apiUrl.length > 25 ? data.apiUrl.substring(0, 25) + '...' : data.apiUrl}
                            </p>
                            {data.apiOutputVariable && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-white/20 text-white rounded">
                                    @{data.apiOutputVariable}
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-white/70">Click to configure</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">settings</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                        className="text-white/80 hover:text-red-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>

            {/* Success/Error Handles */}
            <div className="border-t border-white/20">
                <div className="relative h-8 flex items-center justify-end pr-4">
                    <span className="text-xs text-green-300 font-medium mr-2">Success</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="success"
                        className="!bg-green-400 !border-green-600 !w-3 !h-3"
                    />
                </div>
                <div className="relative h-8 flex items-center justify-end pr-4 pb-2">
                    <span className="text-xs text-red-300 font-medium mr-2">Error</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="error"
                        className="!bg-red-400 !border-red-600 !w-3 !h-3"
                    />
                </div>
            </div>
        </div>
    );
};
