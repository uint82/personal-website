export type ToolName = "brush" | "eraser" | "fill" | "spray" | "shape";
export type ShapeName = "line" | "rect" | "circle" | "triangle";
export type SymmetryMode = "none" | "horizontal" | "vertical" | "both";

export interface DrawingState {
  imageData: ImageData;
}

export interface GalleryImage {
  url: string;
  timestamp: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface DrawingConfig {
  activeTool: ToolName;
  currentColor: string;
  brushWidth: number;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  symmetry: SymmetryMode;
  activeShape: ShapeName;
}
