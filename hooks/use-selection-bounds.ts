import { shallow } from "@liveblocks/client";
import { Layer, LayerType, ShapeLayer, ShapeType, XYWH } from "@/types/canvas";
import { useStorage,useSelf } from "@liveblocks/react";

const isOneDimensionalShape = (layer: Layer): layer is ShapeLayer =>
    layer.type === LayerType.Shape && [
        ShapeType.Line,
        ShapeType.Arrow,
        ShapeType.ArrowLeftLine,
        ShapeType.ArrowBidirectionalLine,
    ].includes(layer.shape);

const layerBounds = (layer: Layer): XYWH => {
    if (!isOneDimensionalShape(layer)) return layer;
    const endY = layer.shape === ShapeType.Arrow && (layer.startLayerId || layer.endLayerId)
        ? layer.y + layer.height
        : layer.y;
    const padding = 10;
    return {
        x: Math.min(layer.x, layer.x + layer.width) - padding,
        y: Math.min(layer.y, endY) - padding,
        width: Math.abs(layer.width) + padding * 2,
        height: Math.abs(endY - layer.y) + padding * 2,
    };
};

const boundingBox = (layers: Layer[]): XYWH | null => {
    const first=layers[0];
    if(!first){
        return null;
    }

    const firstBounds = layerBounds(first);
    let left=firstBounds.x;
    let top=firstBounds.y;
    let right=firstBounds.x+firstBounds.width;
    let bottom=firstBounds.y+firstBounds.height;


    for(let i=1;i<layers.length;i++){
        const {x,y,width,height}=layerBounds(layers[i]);
        if(left>x){
            left=x;
        }
        if(top>y){
            top=y;
        }
        if(right<x+width){
            right=x+width;
        }
        if(bottom<y+height){
            bottom=y+height;
        }
    }
    return {
        x:left,
        y:top,
        width:right-left,
        height:bottom-top,
    }
}

export const useSelectionBounds = () => {
    const selection = useSelf((me) => me.presence.selection);
  
    return useStorage((root) => {
      if (!selection) {
        return null;
      }

      const selectedLayers = selection
        .map((layerId) => root.layers.get(layerId)!)
        .filter(Boolean);
  
      return boundingBox(selectedLayers);
    }, shallow);
  };
