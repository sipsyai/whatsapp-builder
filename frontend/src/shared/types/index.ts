export type ViewState = "landing" | "builder" | "chat";
export type NodeDataType = "start" | "message" | "question" | "condition";

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
    buttons?: string[];
    listButtonText?: string;
    listSections?: {
        id: string;
        title: string;
        rows: { id: string; title: string; description: string }[];
    }[];

    // Method to trigger config modal from within node component
    onConfig?: () => void;
}
