export type ViewState = "landing" | "builder" | "chat" | "settings";
export type NodeDataType = "start" | "message" | "question" | "condition" | "whatsapp_flow" | "rest_api" | "google_calendar";

export interface ButtonItem {
  id: string;      // "btn-0", "btn-1", "btn-2"
  title: string;   // Max 20 chars
}

export interface RowItem {
  id: string;        // "row-1", "row-2"
  title: string;     // Max 24 chars
  description?: string; // Max 72 chars
}

export interface SectionItem {
  id: string;
  title: string;     // Max 24 chars
  rows: RowItem[];   // Max 10 rows
}

export interface Condition {
    id: string;
    variable: string;
    operator: string;
    value: string;
}

export interface ConditionGroup {
    conditions: Condition[];
    logicalOperator: 'AND' | 'OR';
}

export interface NodeData {
    label: string;
    type?: NodeDataType; // Keep track of logical type inside data
    content?: string;
    variable?: string;
    options?: string[];
    // Legacy condition fields (for backward compatibility)
    conditionVar?: string;
    conditionOp?: string;
    conditionVal?: string;
    // New condition structure
    conditionGroup?: ConditionGroup;
    messageType?: string;
    questionType?: "text" | "buttons" | "list";

    // Advanced Question Fields
    headerText?: string;
    footerText?: string;
    mediaHeader?: boolean;
    buttons?: ButtonItem[];
    listButtonText?: string;
    listSections?: {
        id: string;
        title: string;
        rows: { id: string; title: string; description: string }[];
    }[];

    // WhatsApp Flow Fields
    whatsappFlowId?: string;
    flowCta?: string;
    flowMode?: 'navigate' | 'data_exchange';
    flowInitialScreen?: string;
    flowInitialData?: Record<string, any>;
    flowOutputVariable?: string;
    flowHeaderText?: string;
    flowBodyText?: string;
    flowFooterText?: string;
    dataSourceId?: string;
    dataSourceEndpoint?: string;
    dataSourceDataKey?: string;

    // REST API Fields
    apiUrl?: string;
    apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    apiHeaders?: Record<string, string>;
    apiBody?: string;
    apiOutputVariable?: string;
    apiResponsePath?: string;
    apiErrorVariable?: string;
    apiTimeout?: number;

    // Google Calendar Fields
    calendarAction?: 'get_today_events' | 'get_tomorrow_events' | 'get_events' | 'check_availability';
    calendarDateSource?: 'variable' | 'static';
    calendarDateVariable?: string;
    calendarStaticDate?: string;
    calendarEndDateSource?: 'variable' | 'static';
    calendarEndDateVariable?: string;
    calendarStaticEndDate?: string;
    calendarMaxResults?: number;
    calendarWorkingHoursStart?: string;
    calendarWorkingHoursEnd?: string;
    calendarSlotDuration?: number;
    calendarOutputVariable?: string;
    calendarOutputFormat?: 'full' | 'slots_only';
    calendarUserSource?: 'owner' | 'static' | 'variable';
    calendarUserId?: string;
    calendarUserVariable?: string;

    // Methods to trigger modal or actions from within node component
    onConfig?: () => void;
    onDelete?: () => void;
}
