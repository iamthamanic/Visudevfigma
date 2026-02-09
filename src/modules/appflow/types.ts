/** Payload sent by user app via postMessage for optional live DOM/route display. */
export interface VisudevDomReport {
  type: "visudev-dom-report";
  route: string;
  buttons?: { tagName: string; role?: string; label?: string }[];
  links?: { href: string; text?: string }[];
}

export interface AppFlowRecord extends Record<string, unknown> {
  flowId: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AppFlowCreateInput = Omit<AppFlowRecord, "projectId" | "createdAt" | "updatedAt"> & {
  flowId?: string;
};

export type AppFlowUpdateInput = Partial<Omit<AppFlowRecord, "flowId" | "projectId" | "createdAt">>;
