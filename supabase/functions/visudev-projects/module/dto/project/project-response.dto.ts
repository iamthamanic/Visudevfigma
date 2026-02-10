export type ProjectResponseDto = Record<string, unknown> & {
  id: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
};
