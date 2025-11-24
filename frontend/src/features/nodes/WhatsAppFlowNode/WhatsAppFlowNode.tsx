import { Handle, Position } from "@xyflow/react";
import type { NodeData } from "../../../shared/types";

export const WhatsAppFlowNode = ({ data }: { data: NodeData }) => {
    return (
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-lg border-2 border-green-400 w-72 group hover:ring-2 hover:ring-green-300 transition-all">
            <Handle type="target" position={Position.Left} className="!bg-white !border-green-400" />
            <div className="flex items-start gap-3 p-4">
                <div className="bg-white/20 text-white flex items-center justify-center rounded-lg shrink-0 size-12">
                    <span className="material-symbols-outlined text-2xl">check_box</span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-white truncate">{data.label || "WhatsApp Flow"}</p>
                    <p className="text-xs text-white/90 truncate">
                        {data.whatsappFlowId ? `Flow: ${data.flowCta || 'Start'}` : "Click to configure"}
                    </p>
                    {data.flowMode && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-white/20 text-white rounded">
                            {data.flowMode}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }}
                        className="text-white/80 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-lg">settings</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                        className="text-white/80 hover:text-red-300"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="!bg-white !border-green-400" />
        </div>
    );
};
