export interface GraphCanvasNode {
  id: string;
  label: string;
  kind: string;
  color?: string;
}

export interface GraphCanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  kind: string;
}
