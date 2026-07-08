/** Route scope contract for Blueprint subgraph assignment (stable type boundary). */

export interface RouteScope {
  id: string;
  method: string;
  path: string;
  filePath: string;
  line: number;
  relatedFiles: string[];
}
