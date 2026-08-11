import type { SeriesModule } from "./constants";

export interface Series {
  id: number;
  description: string;
  format: string;
  consecutive: number;
  module: SeriesModule;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeriesRequest {
  description: string;
  format: string;
  consecutive: number;
  module: SeriesModule;
  isActive: boolean;
}

export type UpdateSeriesRequest = Partial<CreateSeriesRequest>;
