/**
 * Flow Playground Type Definitions
 *
 * Types specific to the Flow Playground page and its components.
 */

import type { BuilderScreen } from './builder.types';
import type { FlowJSONVersion } from './flow-json.types';

/**
 * BuilderFlow type for playground save callback
 */
export interface BuilderFlow {
  name: string;
  screens: BuilderScreen[];
  version: FlowJSONVersion;
}
