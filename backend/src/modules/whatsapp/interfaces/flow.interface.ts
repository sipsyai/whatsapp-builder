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

/**
 * Response from Meta API when listing flows
 */
export interface MetaFlowsListResponse {
  data: MetaFlowItem[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

/**
 * Single flow item from Meta API
 */
export interface MetaFlowItem {
  id: string;
  name: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'BLOCKED' | 'THROTTLED';
  categories: string[];
  validation_errors?: FlowValidationError[];
  updated_at?: string;
  json_version?: string;
  endpoint_uri?: string;
  preview?: {
    preview_url: string;
    expires_at: string;
  };
}

/**
 * Response from Meta API when fetching flow assets
 */
export interface FlowAssetsResponse {
  data: FlowAsset[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
  };
}

/**
 * Single flow asset from Meta API
 */
export interface FlowAsset {
  name: string;
  asset_type: 'FLOW_JSON' | string;
  download_url: string;
}
