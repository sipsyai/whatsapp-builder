export type ViewState = "landing" | "builder" | "chat" | "settings";
export type NodeDataType = "start" | "message" | "question" | "condition";

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

export interface NodeData {
    label: string;
    type?: NodeDataType; // Keep track of logical type inside data
    content?: string;
    variable?: string;
    options?: string[];
    conditionVar?: string;
    conditionOp?: string;
    conditionVal?: string;
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

    // Methods to trigger modal or actions from within node component
    onConfig?: () => void;
    onDelete?: () => void;
}
