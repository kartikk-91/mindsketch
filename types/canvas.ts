export type Color = {
    r: number;
    g: number;
    b: number;
};

export type Camera = {
  x: number;
  y: number;
  scale: number;
};


export enum LayerType {
    Text,
    Note,
    Rectangle,
    Ellipse,
    Path,
    Image,
    Shape,
}


export enum ShapeType {
    Rectangle,
    Ellipse,
    Line,
    Arrow,
    Diamond,
    Triangle,
    Star,
    Capsule,
    Parallelogram,
    Cylinder,
    Cloud,
    Pentagon,
    Hexagon,
    Heart,
    SpeechBubble,
    Cube,
    Pyramid,
    Cone,
    Document,
  
    ArrowLeft,
    ArrowRight,
    ArrowBidirectional,
    ArrowLeftLine,
    ArrowBidirectionalLine,
    Code,
}

export type ShapeLayer = {
    type: LayerType.Shape;
    shape: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;

    fill?: Color;
    stroke?: Color;
    strokeWidth?: number;
    dashed?: boolean;
    opacity?: number;
    
    startLayerId?: string;
    endLayerId?: string;
    startSide?: Side;
    endSide?: Side;
    
    startSideLocked?: boolean;
    endSideLocked?: boolean;
    
    arrowhead?: "right" | "left" | "both";

    rotation?: number;
    value?: string;
};



export type RectangleLayer = {
    type: LayerType.Rectangle;
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: Color; stroke?: Color; strokeWidth?: number; value?: string; opacity?: number;
    rotation?: number;
};

export type EllipseLayer = {
    type: LayerType.Ellipse;
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: Color;
    stroke?: Color; strokeWidth?: number; value?: string; opacity?: number;
    rotation?: number;
};


export type TextLayer = {
    type: LayerType.Text;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    value?: string;
    rotation?: number;
    textAlign: "left" | "center" | "right";
    fontFamily?: NoteFontFamily;
    fontWeight?: "regular" | "bold";
    opacity?: number;
};

export type NoteFontFamily =
  | "kalam"
  | "inter"
  | "nunito"
  | "mono"
  | "serif"
  | "caveat"
  | "poppins"
  | "playfair";

export type NoteLayer = {
  type: LayerType.Note;

  x: number;
  y: number;
  width: number;
  height: number;

  fill: Color;
  value: string;
  rotation?: number;

  fontFamily: NoteFontFamily;
  fontSize: number | "auto";
  fontWeight?: "regular" | "bold";
  textAlign: "left" | "center" | "right";
  verticalAlign: "top" | "center";
  padding: number;
  opacity?: number;
};


export type PathLayer = {
    type: LayerType.Path;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    points: number[][];
    value?: string;
    rotation?: number;
    opacity?: number;
    strokeWidth?: number;
};


export type ImageLayer = {
    type: LayerType.Image;
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
    value?: string;
    rotation?: number;
    opacity?: number;
};

export type Point = {
    x: number;
    y: number;
};

export type XYWH = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export enum Side {
    Top = 1,
    Bottom = 2,
    Left = 4,
    Right = 8,
}

export type CanvasState =
    | {
        mode: CanvasMode.None;
    }
    | {
        mode: CanvasMode.Pressing;
        origin: Point;
    }
    | {
        mode: CanvasMode.SelectionNet;
        origin: Point;
        current?: Point;
    }
    | {
        mode: CanvasMode.Translating;
        current: Point;
    }
    | {
        mode: CanvasMode.Inserting;
        layertype: LayerType.Image;
        imageSrc: string;
        current?: Point;
    }
    | {
        mode: CanvasMode.Inserting;
        layertype: LayerType.Shape;
        shape: ShapeType;
        current?: Point;
    }
    | {
        mode: CanvasMode.Inserting;
        layertype:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note
        | LayerType.Path;
        current?: Point;
    }
    | {
        mode: CanvasMode.Resizing;
        intialBounds: XYWH;
        corner: Side;
    }
    | {
        mode: CanvasMode.Rotating;
        center: Point;
        startAngle: number;
        initialRotation: number;
    }

    | {
        mode: CanvasMode.Pencil;
    }
    | {
        mode: CanvasMode.Erasing;
    }
    | {
        mode: CanvasMode.Connecting;
        sourceId?: string;
    };

export enum CanvasMode {
    None,
    Pressing,
    SelectionNet,
    Translating,
    Inserting,
    Resizing,
    Pencil,
    Erasing,
    Rotating,
    Connecting,
}


export type Layer =
    | RectangleLayer
    | EllipseLayer
    | TextLayer
    | NoteLayer
    | PathLayer
    | ImageLayer
    | ShapeLayer;
