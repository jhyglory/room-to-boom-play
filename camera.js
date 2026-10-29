import { furnitureVisualBounds } from './assets.js?v=0.18.0';

// Presentation bounds only. World coordinates, colliders and launch energy are
// unchanged. The default frame trims the room artwork's decorative surround.
export const DEFAULT_VIEW = Object.freeze({ minX:28.5, maxX:491.5, minY:10, maxY:906 });
const CENTER = Object.freeze({ x:260, y:458 });
const MARGIN = 2;
const validView = view => view && ['minX','maxX','minY','maxY'].every(key=>Number.isFinite(view[key]))
  && view.maxX>view.minX && view.maxY>view.minY;

export function projection(view=DEFAULT_VIEW, pixelWidth, pixelHeight) {
  if(!validView(view)||!Number.isFinite(pixelWidth)||!Number.isFinite(pixelHeight)||pixelWidth<=0||pixelHeight<=0)
    throw new RangeError('Camera projection requires finite positive view and pixel dimensions.');
  const width=view.maxX-view.minX, height=view.maxY-view.minY;
  const scale=Math.min(pixelWidth/width,pixelHeight/height);
  return { scale, offsetX:(pixelWidth-width*scale)/2-view.minX*scale,
    offsetY:(pixelHeight-height*scale)/2-view.minY*scale };
}

export function expandedCameraView(previous=DEFAULT_VIEW, bodies=[]) {
  const view=validView(previous)?previous:DEFAULT_VIEW;
  // Symmetric expansion preserves a stable room center and cannot trim any
  // part of the previous view, even if a caller supplied off-center bounds.
  let halfWidth=Math.max(CENTER.x-DEFAULT_VIEW.minX,DEFAULT_VIEW.maxX-CENTER.x,
    CENTER.x-view.minX,view.maxX-CENTER.x);
  let halfHeight=Math.max(CENTER.y-DEFAULT_VIEW.minY,DEFAULT_VIEW.maxY-CENTER.y,
    CENTER.y-view.minY,view.maxY-CENTER.y);
  const include=point=>{
    if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return;
    halfWidth=Math.max(halfWidth,Math.abs(point.x-CENTER.x)+MARGIN);
    halfHeight=Math.max(halfHeight,Math.abs(point.y-CENTER.y)+MARGIN);
  };
  for(const body of bodies||[]) {
    if(!body)continue;
    for(const vertex of body.vertices||[])include(vertex);
    const bounds=furnitureVisualBounds(body.game?.kind||body.game?.id,{alpha:16});
    if(!bounds||!body.position||!Number.isFinite(body.position.x)||!Number.isFinite(body.position.y))continue;
    const angle=Number.isFinite(body.angle)?body.angle:0,c=Math.cos(angle),s=Math.sin(angle);
    for(const [x,y]of [[bounds.minX,bounds.minY],[bounds.maxX,bounds.minY],
      [bounds.maxX,bounds.maxY],[bounds.minX,bounds.maxY]])
      include({x:body.position.x+x*c-y*s,y:body.position.y+x*s+y*c});
  }
  return {minX:CENTER.x-halfWidth,maxX:CENTER.x+halfWidth,
    minY:CENTER.y-halfHeight,maxY:CENTER.y+halfHeight};
}
