export type Color = {
    r: number;
    g: number;
    b: number;
};

export type Camera = {
    x: number;
    y: number;
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

    rotation?: number;
    value?: string;
};



export type RectangleLayer = {
    type: LayerType.Rectangle;
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: Color; stroke?: Color; strokeWidth?: number; value?: string;
};

export type EllipseLayer = {
    type: LayerType.Ellipse;
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: Color;
    stroke?: Color; strokeWidth?: number; value?: string;
};


export type TextLayer = {
    type: LayerType.Text;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    value?: string;
};

export type NoteLayer = {
    type: LayerType.Note;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    value?: string;
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
};


export type ImageLayer = {
    type: LayerType.Image;
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
    value?: string;
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
    };

export enum CanvasMode {
    None,
    Pressing,
    SelectionNet,
    Translating,
    Inserting,
    Resizing,
    Pencil,
    Rotating,
}


export type Layer =
    | RectangleLayer
    | EllipseLayer
    | TextLayer
    | NoteLayer
    | PathLayer
    | ImageLayer
    | ShapeLayer;