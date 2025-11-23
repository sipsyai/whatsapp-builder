export interface FlowResponse {
  id: string;
  success?: boolean;
  validation_errors?: FlowValidationError[];
}

export interface FlowValidationError {
  error: string;
  error_type: string;
  message: string;
  line_start?: number;
  line_end?: number;
  column_start?: number;
  column_end?: number;
}

export interface FlowDetails {
  id: string;
  name: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'BLOCKED' | 'THROTTLED';
  categories: string[];
  validation_errors?: FlowValidationError[];
  preview?: {
    preview_url: string;
    expires_at: string;
  };
  health_status?: FlowHealthStatus;
}

export interface FlowHealthStatus {
  can_send_message: 'AVAILABLE' | 'BLOCKED' | 'THROTTLED';
  entities?: FlowHealthEntity[];
}

export interface FlowHealthEntity {
  entity_type: string;
  errors?: FlowHealthError[];
}

export interface FlowHealthError {
  error_code: string;
  error_description: string;
  possible_solution?: string;
}
