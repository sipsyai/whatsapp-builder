/**
 * Type definitions for DataSourceConnection (Connection)
 *
 * Connections are child entities of DataSource that define specific API endpoints
 * with their configuration, transformation rules, and chaining capabilities.
 */

// =============================================================================
// HTTP Methods
// =============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// =============================================================================
// Transform Configuration
// =============================================================================

/**
 * Configuration for transforming API response data into dropdown-compatible format.
 * Used to map arbitrary API response fields to standardized id/title/description structure.
 *
 * @example
 * // For Strapi response with { data: [{ id: 1, attributes: { name: 'iPhone', desc: 'Phone' } }] }
 * const transform: TransformConfig = {
 *   idField: 'id',
 *   titleField: 'attributes.name',
 *   descriptionField: 'attributes.desc'
 * };
 */
export interface TransformConfig {
  /** JSONPath or dot notation path to the ID field */
  idField: string;
  /** JSONPath or dot notation path to the title/label field */
  titleField: string;
  /** Optional JSONPath or dot notation path to the description field */
  descriptionField?: string;
}

// =============================================================================
// Chain Configuration (JSONPath-based)
// =============================================================================

/**
 * Configuration for chaining connections using JSONPath expressions.
 * Allows a connection to depend on the selection from another connection.
 *
 * @example
 * // Chain products to depend on brand selection
 * const chainConfig: ChainConfig = {
 *   dependsOnConnectionId: 'brand-connection-uuid',
 *   paramMapping: {
 *     'filters[brand][$eq]': '$.selectedBrand.id',
 *     'filters[category][$eq]': '$.selectedCategory.id'
 *   }
 * };
 */
export interface ChainConfig {
  /** UUID of the connection this connection depends on */
  dependsOnConnectionId: string;
  /**
   * Mapping of parameter names to JSONPath expressions.
   * Keys are the query parameter names, values are JSONPath expressions
   * that extract values from the selected item of the parent connection.
   */
  paramMapping: Record<string, string>;
}

// =============================================================================
// DataSourceConnection Entity
// =============================================================================

/**
 * DataSourceConnection represents a specific API endpoint configuration
 * within a DataSource. Connections can be chained together for dependent dropdowns.
 */
export interface DataSourceConnection {
  /** Unique identifier (UUID) */
  id: string;
  /** Parent DataSource UUID */
  dataSourceId: string;
  /** Human-readable name for the connection */
  name: string;
  /** Optional description explaining the connection's purpose */
  description?: string;
  /** API endpoint path (relative to DataSource baseUrl) */
  endpoint: string;
  /** HTTP method for the request */
  method: HttpMethod;
  /** Default query parameters to include in every request */
  defaultParams?: Record<string, any>;
  /** Default request body for POST/PUT/PATCH requests */
  defaultBody?: any;
  /**
   * JSONPath or key to extract the data array from response.
   * @example 'data' for { data: [...] } or 'data.items' for nested
   */
  dataKey?: string;
  /** Configuration for transforming response data to dropdown format */
  transformConfig?: TransformConfig;
  /** UUID of the connection this depends on (for chaining) */
  dependsOnConnectionId?: string;
  /** The parent connection entity (populated when fetched with relations) */
  dependsOnConnection?: DataSourceConnection;
  /**
   * Parameter mapping using JSONPath expressions.
   * Maps query params to values from parent connection's selected item.
   * @example { 'filters[brand][$eq]': '$.id' }
   */
  paramMapping?: Record<string, string>;
  /** Whether this connection is active and can be used */
  isActive: boolean;
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Last update timestamp (ISO string) */
  updatedAt: string;
}

// =============================================================================
// DTOs - Create/Update Operations
// =============================================================================

/**
 * DTO for creating a new DataSourceConnection
 */
export interface CreateConnectionDto {
  /** Human-readable name for the connection */
  name: string;
  /** Optional description explaining the connection's purpose */
  description?: string;
  /** API endpoint path (relative to DataSource baseUrl) */
  endpoint: string;
  /** HTTP method for the request (defaults to GET) */
  method?: HttpMethod;
  /** Default query parameters to include in every request */
  defaultParams?: Record<string, any>;
  /** Default request body for POST/PUT/PATCH requests */
  defaultBody?: any;
  /** JSONPath or key to extract the data array from response */
  dataKey?: string;
  /** Configuration for transforming response data to dropdown format */
  transformConfig?: TransformConfig;
  /** UUID of the connection this depends on (for chaining) */
  dependsOnConnectionId?: string;
  /** Parameter mapping using JSONPath expressions */
  paramMapping?: Record<string, string>;
  /** Whether this connection is active (defaults to true) */
  isActive?: boolean;
}

/**
 * DTO for updating an existing DataSourceConnection
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateConnectionDto extends Partial<CreateConnectionDto> {}

// =============================================================================
// Test Connection Types
// =============================================================================

/**
 * Request payload for testing a connection
 */
export interface TestConnectionRequest {
  /** Override or additional query parameters for testing */
  params?: Record<string, any>;
  /** Override or additional body data for testing */
  body?: any;
  /**
   * Context data for chained connections.
   * Contains the selected values from parent connections.
   * @example { selectedBrand: { id: '1', name: 'Apple' } }
   */
  contextData?: Record<string, any>;
}

/**
 * Response from testing a connection
 */
export interface TestConnectionResponse {
  /** Whether the test was successful */
  success: boolean;
  /** HTTP status code from the API response */
  statusCode?: number;
  /** Time taken for the request in milliseconds */
  responseTime: number;
  /** Raw response data from the API */
  data?: any;
  /**
   * Data transformed using the connection's transformConfig.
   * Standardized format for dropdown components.
   */
  transformedData?: TransformedItem[];
  /** Error message if the test failed */
  error?: string;
}

/**
 * Standardized item format after transformation.
 * Used for dropdown/select components in WhatsApp Flows.
 */
export interface TransformedItem {
  /** Unique identifier for the item */
  id: string;
  /** Display title/label for the item */
  title: string;
  /** Optional description text */
  description?: string;
}

// =============================================================================
// Grouped Connections for WhatsApp Flow Selector
// =============================================================================

/**
 * Connections grouped by their parent DataSource.
 * Used in the WhatsApp Flow builder for selecting dynamic data sources.
 */
export interface GroupedConnections {
  /** Parent DataSource information */
  dataSource: {
    /** DataSource UUID */
    id: string;
    /** DataSource name */
    name: string;
    /** DataSource type (REST_API, STRAPI, GRAPHQL) */
    type: string;
    /** DataSource base URL */
    baseUrl: string;
  };
  /** List of connections belonging to this DataSource */
  connections: DataSourceConnection[];
}

// =============================================================================
// Connection Summary (Lightweight version for lists)
// =============================================================================

/**
 * Lightweight connection summary for list views and selectors.
 * Excludes heavy fields like defaultBody and detailed config.
 */
export interface ConnectionSummary {
  /** Connection UUID */
  id: string;
  /** Parent DataSource UUID */
  dataSourceId: string;
  /** Connection name */
  name: string;
  /** Connection description */
  description?: string;
  /** API endpoint path */
  endpoint: string;
  /** HTTP method */
  method: HttpMethod;
  /** Whether chaining is configured */
  hasChaining: boolean;
  /** Whether transform is configured */
  hasTransform: boolean;
  /** Whether active */
  isActive: boolean;
}

// =============================================================================
// Connection Chain Graph Types
// =============================================================================

/**
 * Represents a node in the connection dependency graph.
 * Used for visualizing and validating connection chains.
 */
export interface ConnectionChainNode {
  /** Connection UUID */
  connectionId: string;
  /** Connection name */
  connectionName: string;
  /** Parent connection UUID (null for root connections) */
  parentConnectionId: string | null;
  /** Child connection UUIDs */
  childConnectionIds: string[];
  /** Depth in the chain (0 for root) */
  depth: number;
}

/**
 * Validation result for a connection chain
 */
export interface ChainValidationResult {
  /** Whether the chain is valid */
  isValid: boolean;
  /** Validation error messages */
  errors: string[];
  /** Warning messages (non-blocking) */
  warnings: string[];
  /** The validated chain structure */
  chain?: ConnectionChainNode[];
}

// =============================================================================
// Re-exports from existing api.ts for convenience
// =============================================================================

// Note: DataSource, DataSourceType, AuthType are re-exported from ./api.ts
// Import them from './api' or './types' as needed
