import { Handle, Position } from "@xyflow/react";
import type { NodeData } from "../../../shared/types";

const ACTION_LABELS: Record<string, string> = {
    'get_today_events': "Today's Events",
    'get_tomorrow_events': "Tomorrow's Events",
    'get_events': "Get Events",
    'check_availability': "Check Availability",
};

export const GoogleCalendarNode = ({ data }: { data: NodeData }) => {
    const action = data.calendarAction || 'check_availability';
    const actionLabel = ACTION_LABELS[action] || "Calendar";
    const hasConfig = data.calendarDateVariable || data.calendarStaticDate || action === 'get_today_events' || action === 'get_tomorrow_events';

    const getCalendarOwnerDisplay = () => {
        const source = data.calendarUserSource || 'owner';
        switch (source) {
            case 'owner':
                return "Owner's Calendar";
            case 'static':
                // Ideally we'd show the user's name, but we only have the ID
                return data.calendarUserId ? "User's Calendar" : null;
            case 'variable':
                return data.calendarUserVariable ? `@${data.calendarUserVariable}'s Calendar` : null;
            default:
                return "Owner's Calendar";
        }
    };

    const getDateDisplay = () => {
        if (action === 'get_today_events') return 'Today';
        if (action === 'get_tomorrow_events') return 'Tomorrow';
        if (data.calendarDateSource === 'variable' && data.calendarDateVariable) {
            return `@${data.calendarDateVariable}`;
        }
        if (data.calendarStaticDate) {
            return data.calendarStaticDate;
        }
        return null;
    };

    const dateDisplay = getDateDisplay();
    const calendarOwnerDisplay = getCalendarOwnerDisplay();

    return (
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl shadow-lg border-2 border-emerald-400 min-w-[280px] group hover:ring-2 hover:ring-emerald-300 transition-all">
            <Handle type="target" position={Position.Left} className="!bg-white !border-emerald-400" />

            <div className="flex items-start gap-3 p-4">
                <div className="bg-white/20 text-white flex items-center justify-center rounded-lg shrink-0 size-12">
                    <span className="material-symbols-outlined text-2xl">calendar_month</span>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-white truncate">{data.label || "Google Calendar"}</p>
                    {/* Action Badge */}
                    <span className="inline-block px-2 py-0.5 text-xs bg-emerald-400/30 text-emerald-100 rounded mt-1">
                        {actionLabel}
                    </span>
                    {hasConfig ? (
                        <div className="space-y-1 mt-1">
                            {calendarOwnerDisplay && (
                                <p className="text-xs text-white/80 truncate flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    {calendarOwnerDisplay}
                                </p>
                            )}
                            {dateDisplay && (
                                <p className="text-xs text-white/80 truncate">
                                    {dateDisplay}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-1">
                                {data.calendarOutputVariable && (
                                    <span className="inline-block px-2 py-0.5 text-xs bg-white/20 text-white rounded">
                                        @{data.calendarOutputVariable}
                                    </span>
                                )}
                                {action === 'check_availability' && data.calendarSlotDuration && (
                                    <span className="inline-block px-2 py-0.5 text-xs bg-white/20 text-white rounded">
                                        {data.calendarSlotDuration}min slots
                                    </span>
                                )}
                                {action === 'get_events' && data.calendarMaxResults && (
                                    <span className="inline-block px-2 py-0.5 text-xs bg-white/20 text-white rounded">
                                        Max {data.calendarMaxResults}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-white/70 mt-1">Click to configure</p>
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
