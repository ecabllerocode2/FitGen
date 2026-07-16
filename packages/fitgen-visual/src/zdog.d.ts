declare module 'zdog' {
  export interface IllustrationOptions {
    element?: HTMLElement;
    resize?: boolean;
    dragRotate?: boolean;
    zoom?: number;
    onDragStart?: (this: Illustration) => void;
    onDragEnd?: (this: Illustration) => void;
  }

  export interface ShapeOptions {
    addTo?: Group | Illustration;
    diameter?: number;
    width?: number;
    height?: number;
    stroke?: number;
    color?: string;
    translate?: { x?: number; y?: number; z?: number };
    rotate?: { x?: number; y?: number; z?: number };
    scale?: number;
    cornerRadius?: number;
    opacity?: number;
  }

  export class Illustration {
    element: HTMLElement;
    isDragging: boolean;
    constructor(options: IllustrationOptions);
    updateRenderGraph(): void;
  }

  export class Group {
    rotate: { x: number; y: number; z: number };
    constructor(options?: ShapeOptions);
  }

  export class Ellipse {
    constructor(options?: ShapeOptions);
  }

  export class Rect {
    constructor(options?: ShapeOptions);
  }

  export class RoundedRect {
    constructor(options?: ShapeOptions);
  }

  const Zdog: {
    Illustration: typeof Illustration;
    Group: typeof Group;
    Ellipse: typeof Ellipse;
    Rect: typeof Rect;
    RoundedRect: typeof RoundedRect;
  };

  export default Zdog;
}
