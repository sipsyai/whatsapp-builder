import { useState, useEffect } from "react";
import { client } from "../../../api/client";

type CalendarActionType = 'get_today_events' | 'get_tomorrow_events' | 'get_events' | 'check_availability';
type DateSourceType = 'variable' | 'static';
type OutputFormatType = 'full' | 'slots_only';
type CalendarUserSourceType = 'owner' | 'static' | 'variable';

interface CalendarUser {
    id: string;
    name: string;
    email: string;
}

interface ConfigGoogleCalendarProps {
    data: any;
    onClose: () => void;
    onSave: (data: any) => void;
}

const ACTION_OPTIONS: { value: CalendarActionType; label: string; description: string }[] = [
    { value: 'get_today_events', label: "Get Today's Events", description: "Retrieve all events scheduled for today" },
    { value: 'get_tomorrow_events', label: "Get Tomorrow's Events", description: "Retrieve all events scheduled for tomorrow" },
    { value: 'get_events', label: "Get Events by Date", description: "Retrieve events for a specific date or date range" },
    { value: 'check_availability', label: "Check Availability", description: "Find available time slots on a specific date" },
];

export const ConfigGoogleCalendar = ({ data, onClose, onSave }: ConfigGoogleCalendarProps) => {
    // Form state
    const [action, setAction] = useState<CalendarActionType>(data.calendarAction || 'check_availability');
    const [label, setLabel] = useState(data.label || "Google Calendar");

    // Calendar Owner state
    const [calendarUserSource, setCalendarUserSource] = useState<CalendarUserSourceType>(data.calendarUserSource || 'owner');
    const [calendarUserId, setCalendarUserId] = useState(data.calendarUserId || '');
    const [calendarUserVariable, setCalendarUserVariable] = useState(data.calendarUserVariable || '');
    const [calendarUsers, setCalendarUsers] = useState<CalendarUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [dateSource, setDateSource] = useState<DateSourceType>(data.calendarDateSource || 'variable');
    const [dateVariable, setDateVariable] = useState(data.calendarDateVariable || "");
    const [staticDate, setStaticDate] = useState(data.calendarStaticDate || "");
    const [endDateSource, setEndDateSource] = useState<DateSourceType>(data.calendarEndDateSource || 'variable');
    const [endDateVariable, setEndDateVariable] = useState(data.calendarEndDateVariable || "");
    const [staticEndDate, setStaticEndDate] = useState(data.calendarStaticEndDate || "");
    const [maxResults, setMaxResults] = useState<number>(data.calendarMaxResults || 10);
    const [workingHoursStart, setWorkingHoursStart] = useState(data.calendarWorkingHoursStart || "09:00");
    const [workingHoursEnd, setWorkingHoursEnd] = useState(data.calendarWorkingHoursEnd || "18:00");
    const [slotDuration, setSlotDuration] = useState<number>(data.calendarSlotDuration || 30);
    const [outputVariable, setOutputVariable] = useState(data.calendarOutputVariable || "");
    const [outputFormat, setOutputFormat] = useState<OutputFormatType>(data.calendarOutputFormat || 'full');
    const [useEndDate, setUseEndDate] = useState<boolean>(!!data.calendarEndDateSource || !!data.calendarEndDateVariable || !!data.calendarStaticEndDate);

    // Fetch users with Google Calendar connected
    useEffect(() => {
        const fetchCalendarUsers = async () => {
            if (calendarUserSource !== 'static') return;

            setLoadingUsers(true);
            try {
                // Fetch users with Google Calendar connected using axios client (includes auth token)
                const response = await client.get<CalendarUser[]>('/api/users?hasGoogleCalendar=true');
                setCalendarUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch calendar users:', error);
                setCalendarUsers([]);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchCalendarUsers();
    }, [calendarUserSource]);

    const handleSave = () => {
        const baseData = {
            ...data,
            label,
            calendarAction: action,
            calendarOutputVariable: outputVariable || undefined,
            // Calendar User fields
            calendarUserSource: calendarUserSource,
            calendarUserId: calendarUserSource === 'static' ? calendarUserId : undefined,
            calendarUserVariable: calendarUserSource === 'variable' ? calendarUserVariable : undefined,
        };

        // Add action-specific fields
        if (action === 'get_today_events' || action === 'get_tomorrow_events') {
            // Only label and output variable needed
            onSave({
                ...baseData,
                // Clear unused fields
                calendarDateSource: undefined,
                calendarDateVariable: undefined,
                calendarStaticDate: undefined,
                calendarEndDateSource: undefined,
                calendarEndDateVariable: undefined,
                calendarStaticEndDate: undefined,
                calendarMaxResults: undefined,
                calendarWorkingHoursStart: undefined,
                calendarWorkingHoursEnd: undefined,
                calendarSlotDuration: undefined,
                calendarOutputFormat: undefined,
            });
        } else if (action === 'get_events') {
            onSave({
                ...baseData,
                calendarDateSource: dateSource,
                calendarDateVariable: dateSource === 'variable' ? dateVariable : undefined,
                calendarStaticDate: dateSource === 'static' ? staticDate : undefined,
                calendarEndDateSource: useEndDate ? endDateSource : undefined,
                calendarEndDateVariable: useEndDate && endDateSource === 'variable' ? endDateVariable : undefined,
                calendarStaticEndDate: useEndDate && endDateSource === 'static' ? staticEndDate : undefined,
                calendarMaxResults: maxResults,
                // Clear unused fields
                calendarWorkingHoursStart: undefined,
                calendarWorkingHoursEnd: undefined,
                calendarSlotDuration: undefined,
                calendarOutputFormat: undefined,
            });
        } else if (action === 'check_availability') {
            onSave({
                ...baseData,
                calendarDateSource: dateSource,
                calendarDateVariable: dateSource === 'variable' ? dateVariable : undefined,
                calendarStaticDate: dateSource === 'static' ? staticDate : undefined,
                calendarWorkingHoursStart: workingHoursStart,
                calendarWorkingHoursEnd: workingHoursEnd,
                calendarSlotDuration: slotDuration,
                calendarOutputFormat: outputFormat,
                // Clear unused fields
                calendarEndDateSource: undefined,
                calendarEndDateVariable: undefined,
                calendarStaticEndDate: undefined,
                calendarMaxResults: undefined,
            });
        }
        onClose();
    };

    const isValid = () => {
        // For get_today_events and get_tomorrow_events, no date fields required
        if (action === 'get_today_events' || action === 'get_tomorrow_events') {
            return true;
        }
        // For get_events and check_availability, date is required
        if (dateSource === 'variable' && !dateVariable) return false;
        if (dateSource === 'static' && !staticDate) return false;
        // For get_events with end date
        if (action === 'get_events' && useEndDate) {
            if (endDateSource === 'variable' && !endDateVariable) return false;
            if (endDateSource === 'static' && !staticEndDate) return false;
        }
        return true;
    };

    const getInfoText = () => {
        switch (action) {
            case 'get_today_events':
                return "This node retrieves all calendar events scheduled for today and stores them in the output variable.";
            case 'get_tomorrow_events':
                return "This node retrieves all calendar events scheduled for tomorrow and stores them in the output variable.";
            case 'get_events':
                return "This node retrieves calendar events for the specified date or date range and stores them in the output variable.";
            case 'check_availability':
                return "This node checks Google Calendar availability for the specified date and returns available time slots based on your working hours and slot duration settings.";
            default:
                return "";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-xl h-full bg-[#102216] shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex justify-between items-center p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-emerald-500">calendar_month</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">Configure Google Calendar</h1>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Action Selection */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Action</label>
                        <select
                            value={action}
                            onChange={e => setAction(e.target.value as CalendarActionType)}
                            className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                        >
                            {ACTION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                            {ACTION_OPTIONS.find(opt => opt.value === action)?.description}
                        </p>
                    </div>

                    {/* Label */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Label</label>
                        <input
                            type="text"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                            placeholder="Google Calendar Node Label"
                        />
                    </div>

                    {/* Calendar Owner Selection */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Calendar Owner</label>
                        <p className="text-xs text-gray-400 mb-3">Whose calendar should be read?</p>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="radio"
                                    name="calendarUserSource"
                                    value="owner"
                                    checked={calendarUserSource === 'owner'}
                                    onChange={() => setCalendarUserSource('owner')}
                                    className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                />
                                <div>
                                    <span className="text-white font-medium">Chatbot Owner</span>
                                    <span className="text-xs text-gray-400 ml-2">(default)</span>
                                    <p className="text-xs text-gray-400">Use the calendar of the user who owns this chatbot</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="radio"
                                    name="calendarUserSource"
                                    value="static"
                                    checked={calendarUserSource === 'static'}
                                    onChange={() => setCalendarUserSource('static')}
                                    className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                />
                                <div>
                                    <span className="text-white font-medium">Specific User</span>
                                    <p className="text-xs text-gray-400">Select a specific user with Google Calendar connected</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="radio"
                                    name="calendarUserSource"
                                    value="variable"
                                    checked={calendarUserSource === 'variable'}
                                    onChange={() => setCalendarUserSource('variable')}
                                    className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                />
                                <div>
                                    <span className="text-white font-medium">From Variable</span>
                                    <span className="text-xs text-gray-400 ml-2">(dynamic)</span>
                                    <p className="text-xs text-gray-400">Use a user ID from a chatbot variable</p>
                                </div>
                            </label>
                        </div>

                        {/* Show user dropdown if 'static' selected */}
                        {calendarUserSource === 'static' && (
                            <div className="mt-3">
                                <select
                                    value={calendarUserId}
                                    onChange={(e) => setCalendarUserId(e.target.value)}
                                    className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                    disabled={loadingUsers}
                                >
                                    <option value="">
                                        {loadingUsers ? 'Loading users...' : 'Select a user...'}
                                    </option>
                                    {calendarUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Users with Google Calendar connected
                                </p>
                            </div>
                        )}

                        {/* Show variable input if 'variable' selected */}
                        {calendarUserSource === 'variable' && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    placeholder="e.g., selected_stylist_id"
                                    value={calendarUserVariable}
                                    onChange={(e) => setCalendarUserVariable(e.target.value)}
                                    className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Variable containing the user ID whose calendar to read
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Date Source - only for get_events and check_availability */}
                    {(action === 'get_events' || action === 'check_availability') && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-white mb-3">Date Source</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                        <input
                                            type="radio"
                                            name="dateSource"
                                            value="variable"
                                            checked={dateSource === 'variable'}
                                            onChange={() => setDateSource('variable')}
                                            className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <span className="text-white font-medium">From Variable</span>
                                            <p className="text-xs text-gray-400">Use a date value from a chatbot variable</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                        <input
                                            type="radio"
                                            name="dateSource"
                                            value="static"
                                            checked={dateSource === 'static'}
                                            onChange={() => setDateSource('static')}
                                            className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <span className="text-white font-medium">Static Date</span>
                                            <p className="text-xs text-gray-400">Use a fixed date value</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Date Variable (conditional) */}
                            {dateSource === 'variable' && (
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Date Variable</label>
                                    <input
                                        type="text"
                                        value={dateVariable}
                                        onChange={e => setDateVariable(e.target.value)}
                                        className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                        placeholder="selected_date"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Variable containing the date (e.g., from user input)
                                    </p>
                                </div>
                            )}

                            {/* Static Date (conditional) */}
                            {dateSource === 'static' && (
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Static Date</label>
                                    <input
                                        type="date"
                                        value={staticDate}
                                        onChange={e => setStaticDate(e.target.value)}
                                        className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Select a specific date
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* End Date - only for get_events */}
                    {action === 'get_events' && (
                        <>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useEndDate}
                                        onChange={e => setUseEndDate(e.target.checked)}
                                        className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-white">Use Date Range (Optional End Date)</span>
                                </label>
                                <p className="text-xs text-gray-400 mt-1 ml-6">
                                    Enable to retrieve events within a date range
                                </p>
                            </div>

                            {useEndDate && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">End Date Source</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="endDateSource"
                                                    value="variable"
                                                    checked={endDateSource === 'variable'}
                                                    onChange={() => setEndDateSource('variable')}
                                                    className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                                />
                                                <div>
                                                    <span className="text-white font-medium">From Variable</span>
                                                    <p className="text-xs text-gray-400">Use a date value from a chatbot variable</p>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                                <input
                                                    type="radio"
                                                    name="endDateSource"
                                                    value="static"
                                                    checked={endDateSource === 'static'}
                                                    onChange={() => setEndDateSource('static')}
                                                    className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                                />
                                                <div>
                                                    <span className="text-white font-medium">Static End Date</span>
                                                    <p className="text-xs text-gray-400">Use a fixed end date value</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* End Date Variable (conditional) */}
                                    {endDateSource === 'variable' && (
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">End Date Variable</label>
                                            <input
                                                type="text"
                                                value={endDateVariable}
                                                onChange={e => setEndDateVariable(e.target.value)}
                                                className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                                placeholder="end_date"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                Variable containing the end date
                                            </p>
                                        </div>
                                    )}

                                    {/* Static End Date (conditional) */}
                                    {endDateSource === 'static' && (
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">Static End Date</label>
                                            <input
                                                type="date"
                                                value={staticEndDate}
                                                onChange={e => setStaticEndDate(e.target.value)}
                                                className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                Select a specific end date
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Max Results */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Max Results</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={maxResults}
                                    onChange={e => setMaxResults(parseInt(e.target.value) || 10)}
                                    className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Maximum number of events to retrieve (1-100)
                                </p>
                            </div>
                        </>
                    )}

                    {/* Check Availability specific fields */}
                    {action === 'check_availability' && (
                        <>
                            {/* Working Hours */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Working Hours Start</label>
                                    <input
                                        type="time"
                                        value={workingHoursStart}
                                        onChange={e => setWorkingHoursStart(e.target.value)}
                                        className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Working Hours End</label>
                                    <input
                                        type="time"
                                        value={workingHoursEnd}
                                        onChange={e => setWorkingHoursEnd(e.target.value)}
                                        className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                    />
                                </div>
                            </div>

                            {/* Slot Duration */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Slot Duration</label>
                                <select
                                    value={slotDuration}
                                    onChange={e => setSlotDuration(parseInt(e.target.value))}
                                    className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>60 minutes</option>
                                    <option value={90}>90 minutes</option>
                                    <option value={120}>120 minutes</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Duration of each available time slot
                                </p>
                            </div>

                            {/* Output Format */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-3">Output Format</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                        <input
                                            type="radio"
                                            name="outputFormat"
                                            value="full"
                                            checked={outputFormat === 'full'}
                                            onChange={() => setOutputFormat('full')}
                                            className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <span className="text-white font-medium">Full Response</span>
                                            <p className="text-xs text-gray-400">Include all calendar event details and metadata</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                        <input
                                            type="radio"
                                            name="outputFormat"
                                            value="slots_only"
                                            checked={outputFormat === 'slots_only'}
                                            onChange={() => setOutputFormat('slots_only')}
                                            className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <span className="text-white font-medium">Available Slots Only</span>
                                            <p className="text-xs text-gray-400">Return only the list of available time slots</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Output Variable - always shown */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Output Variable</label>
                        <input
                            type="text"
                            value={outputVariable}
                            onChange={e => setOutputVariable(e.target.value)}
                            className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                            placeholder="calendar_result"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Variable name to store the calendar results
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-400 text-lg">info</span>
                            <div>
                                <p className="text-sm text-emerald-300 font-medium">How it works</p>
                                <p className="text-xs text-emerald-400/80 mt-1">
                                    {getInfoText()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="flex justify-end gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-400 hover:bg-white/10 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isValid()}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                </footer>
            </div>
        </div>
    );
};
