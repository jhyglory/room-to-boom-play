// V2 supplied PNG bytes are preserved under assets/v2. Registration below is
// authored render metadata, never a replacement for the unchanged colliders.
// Full transparent source frames use uniform furniture scales; the vertical
// bed has an explicit local quarter-turn. No PNG is cropped or re-encoded.
const FURNITURE_SPECS = {
  "sofa": {
    "filename": "assets/v2/furniture/sofa_mint.png",
    "sourcePath": "assets/furniture/sofa_mint.png",
    "width": 1254,
    "height": 1254,
    "sha256": "e788c78182f4d33e8880dc97d214b258d440a2321c6815d116ee2eba0f0ebc2d",
    "pivot": {
      "x": 627,
      "y": 565
    },
    "scale": 0.11657559198542805,
    "rotation": 0,
    "sourceOrientation": "landscape",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 128,
      "height": 68
    },
    "opaqueBounds": [
      78,
      272,
      1176,
      974
    ],
    "alphaBounds": [
      77,
      271,
      1178,
      990
    ],
    "registration": "approved-sofa",
    "registrationNote": "Approved source and registration retained; perspective front depth extends beyond the collider."
  },
  "bed": {
    "filename": "assets/v2/furniture/bed_coral.png",
    "sourcePath": "assets/furniture/bed_coral.png",
    "width": 1131,
    "height": 1391,
    "sha256": "2820e466aae9319724370912626f339b9aa56ce8446a4a96b3ea256d7365ce79",
    "pivot": {
      "x": 566.0,
      "y": 679.0
    },
    "scale": 0.1338862559241706,
    "rotation": 1.5707963267948966,
    "sourceOrientation": "portrait",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 148,
      "height": 78
    },
    "opaqueBounds": [
      221,
      180,
      911,
      1178
    ],
    "alphaBounds": [
      220,
      179,
      912,
      1182
    ],
    "registration": "authored-rotated-uniform",
    "registrationNote": "Vertical source rotates90degrees locally; physical horizontal148x78 collider and body angle remain unchanged."
  },
  "fridge": {
    "filename": "assets/v2/furniture/fridge_blue.png",
    "sourcePath": "assets/furniture/fridge_blue.png",
    "width": 1254,
    "height": 1254,
    "sha256": "2d0a4260921fb3d29e7cf16f9d9e11cc3f3683e60f7bca58f50481f902734f57",
    "pivot": {
      "x": 626.0,
      "y": 619.5
    },
    "scale": 0.11764705882352941,
    "rotation": 0,
    "sourceOrientation": "portrait",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 62,
      "height": 92
    },
    "opaqueBounds": [
      381,
      210,
      871,
      1029
    ],
    "alphaBounds": [
      379,
      209,
      873,
      1030
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "bookcase": {
    "filename": "assets/v2/furniture/bookcase_oak.png",
    "sourcePath": "assets/furniture/bookcase_oak.png",
    "width": 1312,
    "height": 1199,
    "sha256": "809e07d3c6ec85f920f869e4cadd1e50f298c4dfea1c2ed029cae18890c86c3b",
    "pivot": {
      "x": 662.0,
      "y": 642.0
    },
    "scale": 0.10638297872340426,
    "rotation": 0,
    "sourceOrientation": "near-square",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 56,
      "height": 112
    },
    "opaqueBounds": [
      287,
      281,
      1037,
      1003
    ],
    "alphaBounds": [
      286,
      279,
      1038,
      1004
    ],
    "registration": "authored-pick-capped-uniform",
    "registrationNote": "Near-square art cannot match the frozen56x112 collider uniformly. Alpha16 width capped80 to stay within12-unit pick padding; opaque height~76.81 leaves~17.60 invisible vertical collider per side."
  },
  "table": {
    "filename": "assets/v2/furniture/dining_table_oak.png",
    "sourcePath": "assets/furniture/dining_table_oak.png",
    "width": 1536,
    "height": 1024,
    "sha256": "b06f4311d7e8b1bd06c2e8b1ffad374dc3f836b7d9ad8fd550a5ab7598bb6334",
    "pivot": {
      "x": 770.5,
      "y": 504.5
    },
    "scale": 0.1037394451145959,
    "rotation": 0,
    "sourceOrientation": "landscape",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 100,
      "height": 72
    },
    "opaqueBounds": [
      271,
      175,
      1270,
      834
    ],
    "alphaBounds": [
      270,
      174,
      1271,
      850
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "chair": {
    "filename": "assets/v2/furniture/dining_chair_lavender.png",
    "sourcePath": "assets/furniture/dining_chair_lavender.png",
    "width": 1312,
    "height": 1199,
    "sha256": "edbca9de6f5975c0639afbf8b534b99760d5596be90f0a3e4f7948d7cbca2cb9",
    "pivot": {
      "x": 660.5,
      "y": 610.0
    },
    "scale": 0.06856478791400349,
    "rotation": 0,
    "sourceOrientation": "near-square",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 58,
      "height": 60
    },
    "opaqueBounds": [
      244,
      166,
      1077,
      1054
    ],
    "alphaBounds": [
      242,
      164,
      1079,
      1055
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "boxA": {
    "filename": "assets/v2/furniture/moving_box_yellow.png",
    "sourcePath": "assets/furniture/moving_box_yellow.png",
    "width": 1254,
    "height": 1254,
    "sha256": "00e2f0fd6f95ca07cfbebb53212a1f623a026e0bcfd623b9d182ce732eabecbd",
    "pivot": {
      "x": 629.0,
      "y": 634.0
    },
    "scale": 0.1092436974789916,
    "rotation": 0,
    "sourceOrientation": "near-square",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 52,
      "height": 52
    },
    "opaqueBounds": [
      394,
      393,
      864,
      875
    ],
    "alphaBounds": [
      393,
      392,
      885,
      903
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "boxB": {
    "filename": "assets/v2/furniture/moving_box_kraft.png",
    "sourcePath": "assets/furniture/moving_box_kraft.png",
    "width": 1254,
    "height": 1254,
    "sha256": "7dad283b0d4f2ecaad9ce39560e297d4a8c12c258a80ee54a99c8bb19b9880dd",
    "pivot": {
      "x": 628.0,
      "y": 613.0
    },
    "scale": 0.09219858156028368,
    "rotation": 0,
    "sourceOrientation": "landscape",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 52,
      "height": 52
    },
    "opaqueBounds": [
      323,
      354,
      933,
      872
    ],
    "alphaBounds": [
      321,
      352,
      935,
      902
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "lamp": {
    "filename": "assets/v2/furniture/floor_lamp_mustard.png",
    "sourcePath": "assets/furniture/floor_lamp_mustard.png",
    "width": 1278,
    "height": 1230,
    "sha256": "28017d064d87918730070acdbdb3bdc7b4d6dc209b4e27487e95aed5419a8a83",
    "pivot": {
      "x": 638.0,
      "y": 618.0
    },
    "scale": 0.058898847631242,
    "rotation": 0,
    "sourceOrientation": "portrait",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 44,
      "height": 48
    },
    "opaqueBounds": [
      382,
      93,
      894,
      1143
    ],
    "alphaBounds": [
      381,
      91,
      896,
      1144
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "plant": {
    "filename": "assets/v2/furniture/potted_plant.png",
    "sourcePath": "assets/furniture/potted_plant.png",
    "width": 1297,
    "height": 1212,
    "sha256": "49d6eea7d51cf7467ab7e589f6c6882c2a9175446446d9515f4c72354891fd18",
    "pivot": {
      "x": 652.0,
      "y": 590.0
    },
    "scale": 0.06801736613603473,
    "rotation": 0,
    "sourceOrientation": "near-square",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 46,
      "height": 48
    },
    "opaqueBounds": [
      301,
      250,
      1003,
      930
    ],
    "alphaBounds": [
      299,
      248,
      1004,
      931
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "armchair": {
    "filename": "assets/v2/furniture/armchair_coral.png",
    "sourcePath": "assets/furniture/armchair_coral.png",
    "width": 1296,
    "height": 1214,
    "sha256": "a3956e309b3156869840ac555fc1820e2bcf241f6192f16976b03394f5612eff",
    "pivot": {
      "x": 648.5,
      "y": 603.0
    },
    "scale": 0.10126582278481013,
    "rotation": 0,
    "sourceOrientation": "landscape",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 76,
      "height": 76
    },
    "opaqueBounds": [
      243,
      258,
      1054,
      948
    ],
    "alphaBounds": [
      242,
      257,
      1055,
      949
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "wardrobe": {
    "filename": "assets/v2/furniture/wardrobe_cream.png",
    "sourcePath": "assets/furniture/wardrobe_cream.png",
    "width": 1312,
    "height": 1199,
    "sha256": "7acbd3aa421ac0327b653854293abecdf5c7944844ff02eec4aa7d1f3461f77f",
    "pivot": {
      "x": 656.0,
      "y": 598.0
    },
    "scale": 0.17708333333333334,
    "rotation": 0,
    "sourceOrientation": "near-square",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 94,
      "height": 110
    },
    "opaqueBounds": [
      380,
      298,
      932,
      898
    ],
    "alphaBounds": [
      379,
      296,
      978,
      907
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "dresser": {
    "filename": "assets/v2/furniture/dresser_oak.png",
    "sourcePath": "assets/furniture/dresser_oak.png",
    "width": 1391,
    "height": 1131,
    "sha256": "c4d11306b32da04f18f79af8e757c06f6f4bb89c56e6f0362bced9ef2100b414",
    "pivot": {
      "x": 695.0,
      "y": 578.0
    },
    "scale": 0.11279229711141678,
    "rotation": 0,
    "sourceOrientation": "landscape",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 96,
      "height": 68
    },
    "opaqueBounds": [
      274,
      272,
      1116,
      884
    ],
    "alphaBounds": [
      273,
      270,
      1146,
      907
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "tv_stand": {
    "filename": "assets/v2/furniture/tv_stand_oak.png",
    "sourcePath": "assets/furniture/tv_stand_oak.png",
    "width": 1536,
    "height": 1024,
    "sha256": "d639a2107e7c01fac961364eaa16edea509eefa65d9990d86767c9e442c7bac3",
    "pivot": {
      "x": 768.0,
      "y": 518.0
    },
    "scale": 0.08964646464646464,
    "rotation": 0,
    "sourceOrientation": "landscape",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 84,
      "height": 58
    },
    "opaqueBounds": [
      231,
      263,
      1305,
      773
    ],
    "alphaBounds": [
      230,
      261,
      1333,
      785
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "desk": {
    "filename": "assets/v2/furniture/desk_oak.png",
    "sourcePath": "assets/furniture/desk_oak.png",
    "width": 1536,
    "height": 1024,
    "sha256": "9b0099aa3b96cc5f6ce348e939647f2a149398ce96539dfb301004cad1cd2dc6",
    "pivot": {
      "x": 771.0,
      "y": 509.0
    },
    "scale": 0.11124694376528117,
    "rotation": 0,
    "sourceOrientation": "landscape",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 110,
      "height": 72
    },
    "opaqueBounds": [
      230,
      232,
      1312,
      786
    ],
    "alphaBounds": [
      229,
      231,
      1342,
      813
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  },
  "washing_machine": {
    "filename": "assets/v2/furniture/washing_machine_cream.png",
    "sourcePath": "assets/furniture/washing_machine_cream.png",
    "width": 1254,
    "height": 1254,
    "sha256": "1f13efe5a014d1fd0af00dcdb416645e065d6e66d4318e9985a0c298b2824cb8",
    "pivot": {
      "x": 627.5,
      "y": 631.5
    },
    "scale": 0.08275862068965517,
    "rotation": 0,
    "sourceOrientation": "portrait",
    "type": "raster_furniture_sprite",
    "body": {
      "width": 64,
      "height": 80
    },
    "opaqueBounds": [
      240,
      149,
      1015,
      1114
    ],
    "alphaBounds": [
      239,
      147,
      1016,
      1115
    ],
    "registration": "authored-balanced-uniform",
    "registrationNote": "Full source frame; uniform scale balances the opaque-art width and height against the unchanged collider."
  }
};
export const FURNITURE_ASSET_IDS = Object.freeze(Object.keys(FURNITURE_SPECS));
const ENVIRONMENT_SPECS = {
  "floor_mint": {
    "filename": "assets/v2/environment/floor_mint.png",
    "sourcePath": "assets/environment/floor_mint.png",
    "width": 1254,
    "height": 1254,
    "sha256": "9eb35131e74383bb903467130ee3199ee16c29df2409d3c0c88e963296fe0788",
    "pivot": null,
    "scale": null,
    "rotation": 0,
    "type": "raster_full_room_surface",
    "opaqueBounds": [
      0,
      0,
      1254,
      1254
    ],
    "alphaBounds": [
      0,
      0,
      1254,
      1254
    ]
  },
  "floor_wood": {
    "filename": "assets/v2/environment/floor_wood.png",
    "sourcePath": "assets/environment/floor_wood.png",
    "width": 1254,
    "height": 1254,
    "sha256": "a9ddc2ca6b00c81226e3d434f8a7fef79caaf58fc1ef24b540bb7482192783d8",
    "pivot": null,
    "scale": null,
    "rotation": 0,
    "type": "raster_full_room_surface",
    "opaqueBounds": [
      0,
      0,
      1254,
      1254
    ],
    "alphaBounds": [
      0,
      0,
      1254,
      1254
    ]
  },
  "room_frame": {
    "filename": "assets/v2/environment/room_frame.png",
    "sourcePath": "assets/environment/room_frame.png",
    "width": 1141,
    "height": 1379,
    "sha256": "47b84af8d3cf7c119f7896789f057fba8c059795a7daee393da77422de094fc9",
    "pivot": null,
    "scale": null,
    "rotation": 0,
    "type": "optional_room_frame",
    "opaqueBounds": [
      38,
      70,
      1103,
      1299
    ],
    "alphaBounds": [
      36,
      67,
      1113,
      1311
    ]
  },
  "wall_broken": {
    "filename": "assets/v2/environment/wall_broken.png",
    "sourcePath": "assets/environment/wall_broken.png",
    "width": 2172,
    "height": 724,
    "sha256": "c0c0900a7bbf0fc6f20e5f6c3df8fd26bf1e1c2000fcde45b9abbc43448bd189",
    "pivot": null,
    "scale": null,
    "rotation": 0,
    "type": "raster_wall_surface",
    "opaqueBounds": [
      137,
      273,
      2036,
      470
    ],
    "alphaBounds": [
      136,
      271,
      2037,
      472
    ]
  },
  "wall_cracked": {
    "filename": "assets/v2/environment/wall_cracked.png",
    "sourcePath": "assets/environment/wall_cracked.png",
    "width": 2172,
    "height": 724,
    "sha256": "8dbed5eb762c4b226d8bfb6782c0c1757fd3d565e052bf2c222902cafb834ff9",
    "pivot": {
      "x": 1087.0,
      "y": 364.5
    },
    "scale": 0.12546125461254612,
    "rotation": 0,
    "type": "raster_wall_surface",
    "opaqueBounds": [
      167,
      229,
      2007,
      500
    ],
    "alphaBounds": [
      163,
      228,
      2019,
      523
    ]
  },
  "wall_debris": {
    "filename": "assets/v2/environment/wall_debris.png",
    "sourcePath": "assets/environment/wall_debris.png",
    "width": 1254,
    "height": 1254,
    "sha256": "110a7f21205d352636127868c2e0dc403ce94f17bba77fcbda9a597aceb173a7",
    "pivot": null,
    "scale": null,
    "rotation": 0,
    "type": "cosmetic_raster_sprite",
    "opaqueBounds": [
      210,
      319,
      1050,
      939
    ],
    "alphaBounds": [
      209,
      317,
      1055,
      947
    ]
  },
  "wall_intact": {
    "filename": "assets/v2/environment/wall_intact.png",
    "sourcePath": "assets/environment/wall_intact.png",
    "width": 2172,
    "height": 724,
    "sha256": "8dcde49205c64d35d0f4a902fe8cb5486180511887ffe7cbf2c588e84ab35069",
    "pivot": {
      "x": 1086.0,
      "y": 364.0
    },
    "scale": 0.12781954887218044,
    "rotation": 0,
    "type": "raster_wall_surface",
    "opaqueBounds": [
      169,
      231,
      2003,
      497
    ],
    "alphaBounds": [
      168,
      228,
      2007,
      517
    ]
  }
};
export const ASSET_SPECS = Object.freeze({ ...FURNITURE_SPECS, ...ENVIRONMENT_SPECS });

export const WALL_RENDER = Object.freeze({
  opaqueHeight:34,
  opaqueY:Object.freeze([-17,17]),
  floorUvZoom:1.5,
  broken:Object.freeze({
    leftSourceRect:Object.freeze([0,0,402,724]),
    rightSourceRect:Object.freeze([1772,0,400,724]),
    opaqueY:Object.freeze([273,470]),
    scale:34/197,
  }),
  roomFrameNineSliceCandidate:Object.freeze({left:140,top:177,right:151,bottom:193}),
});

export function spritePlacement(id, { length=152, scale=1 } = {}) {
  const spec=ASSET_SPECS[id];
  // Broken walls must use two independent atlas stubs, never a single quad.
  if(!spec?.pivot||!spec.scale||id==='wall_broken')return null;
  const wall=id==='wall_intact'||id==='wall_cracked';
  const scaleX=wall?length/(spec.opaqueBounds[2]-spec.opaqueBounds[0])*scale:spec.scale*scale;
  const scaleY=spec.scale*scale;
  return {x:-spec.pivot.x*scaleX,y:-spec.pivot.y*scaleY,
    width:spec.width*scaleX,height:spec.height*scaleY,scaleX,scaleY,
    rotation:spec.rotation||0,sourceOrientation:spec.sourceOrientation||'landscape'};
}

export function furnitureVisualBounds(id, { scale=1, alpha=220 } = {}) {
  const spec=ASSET_SPECS[id];
  if(spec?.type!=='raster_furniture_sprite'||!spec.pivot)return null;
  const bounds=alpha===16?spec.alphaBounds:spec.opaqueBounds;
  const [left,top,right,bottom]=bounds,factor=spec.scale*scale;
  const c=Math.cos(spec.rotation||0),s=Math.sin(spec.rotation||0);
  const corners=[[left,top],[right,top],[right,bottom],[left,bottom]].map(([x,y])=>{
    x=(x-spec.pivot.x)*factor;y=(y-spec.pivot.y)*factor;
    return {x:x*c-y*s,y:x*s+y*c};
  });
  return {minX:Math.min(...corners.map(p=>p.x)),minY:Math.min(...corners.map(p=>p.y)),
    maxX:Math.max(...corners.map(p=>p.x)),maxY:Math.max(...corners.map(p=>p.y))};
}

export function brokenWallPlacements({gapStart=-76,gapEnd=76,height=WALL_RENDER.opaqueHeight}={}) {
  const factor=height/(WALL_RENDER.broken.opaqueY[1]-WALL_RENDER.broken.opaqueY[0]);
  const sourceCenterY=(WALL_RENDER.broken.opaqueY[0]+WALL_RENDER.broken.opaqueY[1])/2;
  return [WALL_RENDER.broken.leftSourceRect,WALL_RENDER.broken.rightSourceRect].map((sourceRect,index)=>({
    sourceRect:[...sourceRect],x:index===0?gapStart-sourceRect[2]*factor:gapEnd,
    y:-sourceCenterY*factor,width:sourceRect[2]*factor,height:sourceRect[3]*factor,
    scaleX:factor,scaleY:factor,clipSide:index===0?'left':'right',gapStart,gapEnd,
  }));
}

export function createAssetStore({ ImageClass = globalThis.Image } = {}) {
  const images = new Map();
  const store = { status: ImageClass ? 'loading' : 'unavailable', error: null, version: 0,
    get: id => images.get(id) || null,
    get loadedCount() { return images.size; },
    get isReady() { return this.status === 'ready'; },
  };
  if (!ImageClass) { store.ready = Promise.resolve(store); return store; }
  store.ready = Promise.all(Object.entries(ASSET_SPECS).map(([id, spec]) => new Promise((resolve, reject) => {
    const image = new ImageClass();
    image.decoding = 'async';
    image.onload = async () => {
      try {
        if (typeof image.decode === 'function') await image.decode();
        if (image.naturalWidth !== spec.width || image.naturalHeight !== spec.height)
          throw new Error(`Unexpected image dimensions: ${spec.filename}`);
        images.set(id, image);
        resolve();
      } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error(`Could not load ${spec.filename}`));
    image.src = new URL(spec.filename, import.meta.url).href;
  }))).then(() => { store.status = 'ready'; store.version += 1; return store; }, error => {
    store.status = 'error'; store.error = error; throw error;
  });
  // Rendering may be constructed before the app attaches its visible error UI.
  // Keep the original rejecting promise available to the app's awaited loader.
  store.ready.catch(() => {});
  return store;
}

export const assets = createAssetStore();
