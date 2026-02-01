import type { Project } from "../../lib/visudev/types";

export type ProjectCreateInput = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "screens" | "flows"
>;

export type ProjectUpdateInput = Partial<
  Omit<Project, "id" | "createdAt" | "updatedAt" | "screens" | "flows">
>;
