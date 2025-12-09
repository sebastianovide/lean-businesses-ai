export interface CanvasSection {
  order?: number;
  title: string;
  items?: string[];
  subsections?: CanvasState;
}

export interface CanvasState {
  [sectionId: string]: CanvasSection;
}
