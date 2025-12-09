export interface CanvasSection {
  order?: number;
  title: string;
  items?: string[];
  subsections?: CanvasState;
}

export interface CanvasState {
  [sectionId: string]: CanvasSection;
}

export interface StoredCanvas {
  state: CanvasState;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasStorage {
  [canvasId: string]: StoredCanvas;
}
