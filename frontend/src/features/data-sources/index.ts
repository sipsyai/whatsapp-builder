// Components
export { DataSourcesPage } from './components/DataSourcesPage';
export { ConnectionList } from './components/ConnectionList';
export { ConnectionForm } from './components/ConnectionForm';
export { ConnectionTestPanel } from './components/ConnectionTestPanel';

// API and Types (DataSource)
export {
    getAllDataSources,
    getActiveDataSources,
    getDataSource,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    testConnection,
    connectionApi,
    type DataSourceType,
    type AuthType,
    type DataSource,
    type CreateDataSourceDto,
    type UpdateDataSourceDto,
    type TestConnectionResponse,
} from './api';

// Connection Types (DataSourceConnection)
export type {
    HttpMethod,
    TransformConfig,
    ChainConfig,
    DataSourceConnection,
    CreateConnectionDto,
    UpdateConnectionDto,
    TestConnectionRequest,
    TestConnectionResponse as ConnectionTestResponse,
    TransformedItem,
    GroupedConnections,
    ConnectionSummary,
    ConnectionChainNode,
    ChainValidationResult,
} from './types';
