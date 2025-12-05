export interface CanvasSection {
  id: string;
  order: number;
  title?: string;
  items?: string[];
  subsections?: { title: string; items: string[] }[];
}
