// Source-space ground-support calibration. Original PNG bytes are preserved.
const freezeDeep = value => { if (value && typeof value === "object") { for (const child of Object.values(value)) freezeDeep(child); Object.freeze(value); } return value; };
export const FURNITURE_DAMAGE_EXTENSION_REGISTRATION = freezeDeep({
  "bed": {
    "folder": "bed_coral",
    "normalFootAnchor": {
      "x": 268.5,
      "y": 1177
    },
    "anchorBasis": "Opaque intact left-front bed foot midpoint at its bottom, restricted to source x220..329 so the broken lower central rail never becomes the anchor. Retain the normal local90degree rotation.",
    "registrationNotes": "Opaque intact left-front bed foot midpoint at its bottom, restricted to source x220..329 so the broken lower central rail never becomes the anchor. Retain the normal local90degree rotation.",
    "medium": {
      "footAnchor": {
        "x": 261.5,
        "y": 1178
      },
      "alphaBounds": [
        214,
        171,
        917,
        1181
      ],
      "opaqueBounds": [
        215,
        173,
        916,
        1180
      ],
      "sha256": "70da0312aabbd8cd3c451bfddc46d33bb36d4c50e8788b9ac111bc6a8884ab63",
      "nativeWidth": 1131,
      "nativeHeight": 1391,
      "filename": "assets/damage-full-v1/bed_coral/damage_medium.png",
      "sourcePath": "assets/bed_coral/damage_medium.png",
      "encodedBytes": 1170640,
      "proposedPivot": {
        "x": 559.0,
        "y": 680
      },
      "sourcePixelsPreserved": true
    },
    "heavy": {
      "footAnchor": {
        "x": 261.5,
        "y": 1181
      },
      "alphaBounds": [
        213,
        168,
        914,
        1193
      ],
      "opaqueBounds": [
        214,
        169,
        913,
        1191
      ],
      "sha256": "8b8d90835c4a05342780c54d1a2fab4aac0584103997c16c5816c58bdca3d553",
      "nativeWidth": 1131,
      "nativeHeight": 1391,
      "filename": "assets/damage-full-v1/bed_coral/damage_heavy.png",
      "sourcePath": "assets/bed_coral/damage_heavy.png",
      "encodedBytes": 1130084,
      "proposedPivot": {
        "x": 559.0,
        "y": 683
      },
      "sourcePixelsPreserved": true
    }
  },
  "table": {
    "folder": "dining_table_oak",
    "normalFootAnchor": {
      "x": 381,
      "y": 833
    },
    "anchorBasis": "Opaque left-front support foot midpoint at its bottom, restricted to source x280..459; exclude the sagging right tabletop and right leg.",
    "registrationNotes": "Opaque left-front support foot midpoint at its bottom, restricted to source x280..459; exclude the sagging right tabletop and right leg.",
    "medium": {
      "footAnchor": {
        "x": 380,
        "y": 840
      },
      "alphaBounds": [
        264,
        174,
        1288,
        843
      ],
      "opaqueBounds": [
        265,
        175,
        1286,
        841
      ],
      "sha256": "f35052e700eb282e568a77bdd6b0e0e77c3bc3a8f47e22b1ffc27d0ef3de8110",
      "nativeWidth": 1536,
      "nativeHeight": 1024,
      "filename": "assets/damage-full-v1/dining_table_oak/damage_medium.png",
      "sourcePath": "assets/dining_table_oak/damage_medium.png",
      "encodedBytes": 1744328,
      "proposedPivot": {
        "x": 769.5,
        "y": 511.5
      },
      "sourcePixelsPreserved": true
    },
    "heavy": {
      "footAnchor": {
        "x": 356,
        "y": 865
      },
      "alphaBounds": [
        252,
        171,
        1279,
        888
      ],
      "opaqueBounds": [
        254,
        173,
        1278,
        887
      ],
      "sha256": "d85bb6ffe46035eb047cc01ee53a9b83e90a25b0976bce265832254f09002416",
      "nativeWidth": 1536,
      "nativeHeight": 1024,
      "filename": "assets/damage-full-v1/dining_table_oak/damage_heavy.png",
      "sourcePath": "assets/dining_table_oak/damage_heavy.png",
      "encodedBytes": 1768921,
      "proposedPivot": {
        "x": 745.5,
        "y": 536.5
      },
      "sourcePixelsPreserved": true
    }
  },
  "chair": {
    "folder": "dining_chair_lavender",
    "normalFootAnchor": {
      "x": 334,
      "y": 1054
    },
    "anchorBasis": "Opaque left-front foot midpoint at its bottom, restricted to source x270..449; keep the opposite folded seat/frame in the painted silhouette.",
    "registrationNotes": "Opaque left-front foot midpoint at its bottom, restricted to source x270..449; keep the opposite folded seat/frame in the painted silhouette.",
    "medium": {
      "footAnchor": {
        "x": 331.5,
        "y": 1061
      },
      "alphaBounds": [
        239,
        168,
        1081,
        1064
      ],
      "opaqueBounds": [
        240,
        170,
        1080,
        1062
      ],
      "sha256": "5103b03d511f16df5672b8d156e9a7b951b5faf23ba8bef3a15ff3165fcedecb",
      "nativeWidth": 1312,
      "nativeHeight": 1199,
      "filename": "assets/damage-full-v1/dining_chair_lavender/damage_medium.png",
      "sourcePath": "assets/dining_chair_lavender/damage_medium.png",
      "encodedBytes": 1496029,
      "proposedPivot": {
        "x": 658.0,
        "y": 617
      },
      "sourcePixelsPreserved": true
    },
    "heavy": {
      "footAnchor": {
        "x": 330.5,
        "y": 1061
      },
      "alphaBounds": [
        233,
        174,
        1037,
        1063
      ],
      "opaqueBounds": [
        234,
        175,
        1036,
        1061
      ],
      "sha256": "01a8adaf672387f3080b023b49ab6fceb5a0705394c51bc403b1d00d0be89542",
      "nativeWidth": 1312,
      "nativeHeight": 1199,
      "filename": "assets/damage-full-v1/dining_chair_lavender/damage_heavy.png",
      "sourcePath": "assets/dining_chair_lavender/damage_heavy.png",
      "encodedBytes": 1314720,
      "proposedPivot": {
        "x": 657.0,
        "y": 617
      },
      "sourcePixelsPreserved": true
    }
  },
  "boxA": {
    "folder": "moving_box_yellow",
    "normalFootAnchor": {
      "x": 844,
      "y": 875
    },
    "anchorBasis": "Intact lower-right body edge measured20source pixels above the opaque floor baseline, with anchor y on that baseline. The crushed upper-left face is not re-fit.",
    "registrationNotes": "Intact lower-right body edge measured20source pixels above the opaque floor baseline, with anchor y on that baseline. The crushed upper-left face is not re-fit.",
    "medium": {
      "footAnchor": {
        "x": 844,
        "y": 875
      },
      "alphaBounds": [
        375,
        377,
        865,
        877
      ],
      "opaqueBounds": [
        377,
        379,
        864,
        875
      ],
      "sha256": "f240fc1f297d3a56118077ce4a45d515211c8fc124c3bc3332a6b8429a553ee5",
      "nativeWidth": 1254,
      "nativeHeight": 1254,
      "filename": "assets/damage-full-v1/moving_box_yellow/damage_medium.png",
      "sourcePath": "assets/moving_box_yellow/damage_medium.png",
      "encodedBytes": 463942,
      "proposedPivot": {
        "x": 629,
        "y": 634
      },
      "sourcePixelsPreserved": true
    },
    "heavy": {
      "footAnchor": {
        "x": 845,
        "y": 874
      },
      "alphaBounds": [
        372,
        381,
        865,
        875
      ],
      "opaqueBounds": [
        373,
        383,
        864,
        874
      ],
      "sha256": "0e3c759f5d8be90d6426a5907d70529859f74b58baaf9ff388a18bab74c45da5",
      "nativeWidth": 1254,
      "nativeHeight": 1254,
      "filename": "assets/damage-full-v1/moving_box_yellow/damage_heavy.png",
      "sourcePath": "assets/moving_box_yellow/damage_heavy.png",
      "encodedBytes": 426119,
      "proposedPivot": {
        "x": 630,
        "y": 633
      },
      "sourcePixelsPreserved": true
    }
  },
  "boxB": {
    "folder": "moving_box_kraft",
    "normalFootAnchor": {
      "x": 344,
      "y": 872
    },
    "anchorBasis": "Intact lower-left body edge measured20source pixels above the opaque floor baseline, with anchor y on that baseline. The collapsed upper-right face is not re-fit.",
    "registrationNotes": "Intact lower-left body edge measured20source pixels above the opaque floor baseline, with anchor y on that baseline. The collapsed upper-right face is not re-fit.",
    "medium": {
      "footAnchor": {
        "x": 339,
        "y": 874
      },
      "alphaBounds": [
        317,
        350,
        933,
        875
      ],
      "opaqueBounds": [
        319,
        352,
        932,
        874
      ],
      "sha256": "a09b23c85b14ac11d3b6752f18c1fc1a32a6232e2778d04fd60fbd4c689b1287",
      "nativeWidth": 1254,
      "nativeHeight": 1254,
      "filename": "assets/damage-full-v1/moving_box_kraft/damage_medium.png",
      "sourcePath": "assets/moving_box_kraft/damage_medium.png",
      "encodedBytes": 528934,
      "proposedPivot": {
        "x": 623,
        "y": 615
      },
      "sourcePixelsPreserved": true
    },
    "heavy": {
      "footAnchor": {
        "x": 343,
        "y": 872
      },
      "alphaBounds": [
        319,
        348,
        926,
        902
      ],
      "opaqueBounds": [
        321,
        349,
        925,
        872
      ],
      "sha256": "b9b2d46103ff69653400968bf550b3c74efc2ea55ecbf8114ca6167eadea301a",
      "nativeWidth": 1254,
      "nativeHeight": 1254,
      "filename": "assets/damage-full-v1/moving_box_kraft/damage_heavy.png",
      "sourcePath": "assets/moving_box_kraft/damage_heavy.png",
      "encodedBytes": 609184,
      "proposedPivot": {
        "x": 627,
        "y": 613
      },
      "sourcePixelsPreserved": true
    }
  },
  "lamp": {
    "folder": "floor_lamp_mustard",
    "normalFootAnchor": {
      "x": 638,
      "y": 1143
    },
    "anchorBasis": "Opaque circular floor-base bottom midpoint, restricted to source x500..779. The bending stem and folded shade keep their native displacement.",
    "registrationNotes": "Opaque circular floor-base bottom midpoint, restricted to source x500..779. The bending stem and folded shade keep their native displacement.",
    "medium": {
      "footAnchor": {
        "x": 636,
        "y": 1148
      },
      "alphaBounds": [
        323,
        104,
        863,
        1150
      ],
      "opaqueBounds": [
        324,
        105,
        861,
        1148
      ],
      "sha256": "1878d2f1b682e06f557d4c3d62340a7d48186a23cdcf8ce6436446ee6d850b79",
      "nativeWidth": 1278,
      "nativeHeight": 1230,
      "filename": "assets/damage-full-v1/floor_lamp_mustard/damage_medium.png",
      "sourcePath": "assets/floor_lamp_mustard/damage_medium.png",
      "encodedBytes": 510347,
      "proposedPivot": {
        "x": 636,
        "y": 623
      },
      "sourcePixelsPreserved": true
    },
    "heavy": {
      "footAnchor": {
        "x": 638.5,
        "y": 1147
      },
      "alphaBounds": [
        259,
        156,
        852,
        1148
      ],
      "opaqueBounds": [
        260,
        158,
        851,
        1147
      ],
      "sha256": "4a3939e9b1145a7934866ed7c04446290a8615fc70a19a3532e0783a6d2099b8",
      "nativeWidth": 1278,
      "nativeHeight": 1230,
      "filename": "assets/damage-full-v1/floor_lamp_mustard/damage_heavy.png",
      "sourcePath": "assets/floor_lamp_mustard/damage_heavy.png",
      "encodedBytes": 512407,
      "proposedPivot": {
        "x": 638.5,
        "y": 622
      },
      "sourcePixelsPreserved": true
    }
  },
  "plant": {
    "folder": "potted_plant",
    "normalFootAnchor": {
      "x": 661,
      "y": 930
    },
    "anchorBasis": "Opaque connected pot-base bottom midpoint, restricted to source x500..799 so the drooping left leaf is excluded. Fixed canonical pot baseline; foliage collapse remains visible.",
    "registrationNotes": "Opaque connected pot-base bottom midpoint, restricted to source x500..799 so the drooping left leaf is excluded. Fixed canonical pot baseline; foliage collapse remains visible.",
    "medium": {
      "footAnchor": {
        "x": 654,
        "y": 931
      },
      "alphaBounds": [
        318,
        281,
        990,
        933
      ],
      "opaqueBounds": [
        320,
        282,
        989,
        931
      ],
      "sha256": "774771130834cbdc8dc5395bd4f44eaee6718cbedce43e2d6f50858b41ce48ce",
      "nativeWidth": 1297,
      "nativeHeight": 1212,
      "filename": "assets/damage-full-v1/potted_plant/damage_medium.png",
      "sourcePath": "assets/potted_plant/damage_medium.png",
      "encodedBytes": 527005,
      "proposedPivot": {
        "x": 645,
        "y": 591
      },
      "sourcePixelsPreserved": true
    },
    "heavy": {
      "footAnchor": {
        "x": 636.5,
        "y": 942
      },
      "alphaBounds": [
        245,
        291,
        954,
        943
      ],
      "opaqueBounds": [
        246,
        292,
        953,
        942
      ],
      "sha256": "00483d10c22e36582cb1aaa0e28d74c8d64279b28af6f37e8ccd024c22bf0eef",
      "nativeWidth": 1297,
      "nativeHeight": 1212,
      "filename": "assets/damage-full-v1/potted_plant/damage_heavy.png",
      "sourcePath": "assets/potted_plant/damage_heavy.png",
      "encodedBytes": 597191,
      "proposedPivot": {
        "x": 627.5,
        "y": 602
      },
      "sourcePixelsPreserved": true
    }
  },
  "armchair": {
    "folder": "armchair_coral",
    "normalFootAnchor": {
      "x": 353.5,
      "y": 948
    },
    "registrationNotes": "Intact left front foot: opaque run midpoint three rows above its lower edge; excludes the collapsed right arm and opposite foot.",
    "medium": {
      "footAnchor": {
        "x": 350,
        "y": 950
      },
      "alphaBounds": [
        235,
        251,
        1051,
        951
      ],
      "opaqueBounds": [
        237,
        253,
        1050,
        950
      ],
      "sha256": "b96e06ffd0e5a9385b2920264a94c52ac6c7b9a646986084e9c9cf9f478803c4",
      "nativeWidth": 1295,
      "nativeHeight": 1214,
      "filename": "assets/damage-full-v1/armchair_coral/damage_medium.png",
      "sizeBytes": 974448
    },
    "heavy": {
      "footAnchor": {
        "x": 350.5,
        "y": 952
      },
      "alphaBounds": [
        233,
        253,
        1085,
        978
      ],
      "opaqueBounds": [
        234,
        254,
        1083,
        977
      ],
      "sha256": "61552f2be2366a68ffde42ea578e2f53981d7e787bad8c5c23a854fd32f6a1a4",
      "nativeWidth": 1296,
      "nativeHeight": 1214,
      "filename": "assets/damage-full-v1/armchair_coral/damage_heavy.png",
      "sizeBytes": 1010779
    }
  },
  "wardrobe": {
    "folder": "wardrobe_cream",
    "normalFootAnchor": {
      "x": 440,
      "y": 898
    },
    "registrationNotes": "Intact left lower foot: opaque run midpoint three rows above foot bottom; excludes the bent right door and top.",
    "medium": {
      "footAnchor": {
        "x": 433.5,
        "y": 902
      },
      "alphaBounds": [
        373,
        294,
        929,
        904
      ],
      "opaqueBounds": [
        374,
        296,
        928,
        902
      ],
      "sha256": "207fce8058f0fe69bc667f16caee47be630d61d2dd0df3f9ce1ba56b4db5c40b",
      "nativeWidth": 1312,
      "nativeHeight": 1199,
      "filename": "assets/damage-full-v1/wardrobe_cream/damage_medium.png",
      "sizeBytes": 485224
    },
    "heavy": {
      "footAnchor": {
        "x": 430,
        "y": 902
      },
      "alphaBounds": [
        368,
        294,
        909,
        903
      ],
      "opaqueBounds": [
        369,
        295,
        908,
        902
      ],
      "sha256": "c267cdd004ebf91b7c2373d21da9cba24309075dbea77d255bd5ca1ac5aedf26",
      "nativeWidth": 1312,
      "nativeHeight": 1199,
      "filename": "assets/damage-full-v1/wardrobe_cream/damage_heavy.png",
      "sizeBytes": 490246
    }
  },
  "dresser": {
    "folder": "dresser_oak",
    "normalFootAnchor": {
      "x": 357.5,
      "y": 884
    },
    "registrationNotes": "Left lower foot retained with the support frame: opaque run midpoint three rows above its foot bottom. The generated heavy frame grows downward; rebasing its foot retains ground contact without fitting the opaque box.",
    "medium": {
      "footAnchor": {
        "x": 335,
        "y": 901
      },
      "alphaBounds": [
        261,
        266,
        1125,
        902
      ],
      "opaqueBounds": [
        263,
        268,
        1124,
        901
      ],
      "sha256": "7227c00f94169de3b32e7678bbfde5e4277488cf48f09b195a43c95097a07916",
      "nativeWidth": 1391,
      "nativeHeight": 1131,
      "filename": "assets/damage-full-v1/dresser_oak/damage_medium.png",
      "sizeBytes": 786531
    },
    "heavy": {
      "footAnchor": {
        "x": 324,
        "y": 956
      },
      "alphaBounds": [
        248,
        265,
        1114,
        957
      ],
      "opaqueBounds": [
        249,
        267,
        1113,
        956
      ],
      "sha256": "13cdb1f16969823135e229112a3f956fca5690c16597693ddf4ac58cd4d0eff5",
      "nativeWidth": 1391,
      "nativeHeight": 1131,
      "filename": "assets/damage-full-v1/dresser_oak/damage_heavy.png",
      "sizeBytes": 863281
    }
  },
  "tv_stand": {
    "folder": "tv_stand_oak",
    "normalFootAnchor": {
      "x": 308.5,
      "y": 773
    },
    "registrationNotes": "Intact left lower cabinet foot: opaque run midpoint three rows above its bottom. The sagging right side keeps its authored lower overhang.",
    "medium": {
      "footAnchor": {
        "x": 306.5,
        "y": 775
      },
      "alphaBounds": [
        227,
        248,
        1315,
        780
      ],
      "opaqueBounds": [
        228,
        249,
        1314,
        779
      ],
      "sha256": "e37ee65a0019dbcea110a5a61a8e0351f1d80d9f43854df396ba1d59180e41a9",
      "nativeWidth": 1536,
      "nativeHeight": 1024,
      "filename": "assets/damage-full-v1/tv_stand_oak/damage_medium.png",
      "sizeBytes": 1395873
    },
    "heavy": {
      "footAnchor": {
        "x": 300.5,
        "y": 785
      },
      "alphaBounds": [
        220,
        243,
        1302,
        853
      ],
      "opaqueBounds": [
        221,
        244,
        1301,
        852
      ],
      "sha256": "23360112fa9bf66b8d0bae6e8a1739ee6f96003b59a28fa592c9c8b09c654a2b",
      "nativeWidth": 1536,
      "nativeHeight": 1024,
      "filename": "assets/damage-full-v1/tv_stand_oak/damage_heavy.png",
      "sizeBytes": 1507709
    }
  },
  "desk": {
    "folder": "desk_oak",
    "normalFootAnchor": {
      "x": 1219,
      "y": 786
    },
    "registrationNotes": "Intact right drawer-unit outer foot: opaque run midpoint three rows above its bottom. The damaged left desktop and legs are intentionally not the registration anchor.",
    "medium": {
      "footAnchor": {
        "x": 1220,
        "y": 800
      },
      "alphaBounds": [
        210,
        229,
        1313,
        801
      ],
      "opaqueBounds": [
        212,
        231,
        1312,
        800
      ],
      "sha256": "de424e1bc76de4b3ae413f0d24890c7b9815f84fa1b32c6792a4390f002e537a",
      "nativeWidth": 1536,
      "nativeHeight": 1024,
      "filename": "assets/damage-full-v1/desk_oak/damage_medium.png",
      "sizeBytes": 1425463
    },
    "heavy": {
      "footAnchor": {
        "x": 1218.5,
        "y": 803
      },
      "alphaBounds": [
        180,
        217,
        1323,
        805
      ],
      "opaqueBounds": [
        181,
        218,
        1322,
        804
      ],
      "sha256": "9aca05139482c603f8155752b85728fed1879270d682ec5e49e076e89d33745b",
      "nativeWidth": 1536,
      "nativeHeight": 1024,
      "filename": "assets/damage-full-v1/desk_oak/damage_heavy.png",
      "sizeBytes": 1527449
    }
  },
  "washing_machine": {
    "folder": "washing_machine_cream",
    "normalFootAnchor": {
      "x": 341.5,
      "y": 1114
    },
    "registrationNotes": "Intact left appliance foot: opaque run midpoint three rows above its bottom; excludes the crumpled right casing and open door.",
    "medium": {
      "footAnchor": {
        "x": 341,
        "y": 1115
      },
      "alphaBounds": [
        236,
        142,
        1016,
        1117
      ],
      "opaqueBounds": [
        238,
        144,
        1014,
        1115
      ],
      "sha256": "84343225b34eb8ffaff1cb3a2f91fb9d634c18be63e217fdaed5aa31dc7f24cb",
      "nativeWidth": 1254,
      "nativeHeight": 1254,
      "filename": "assets/damage-full-v1/washing_machine_cream/damage_medium.png",
      "sizeBytes": 1010770
    },
    "heavy": {
      "footAnchor": {
        "x": 338,
        "y": 1116
      },
      "alphaBounds": [
        211,
        128,
        1007,
        1117
      ],
      "opaqueBounds": [
        212,
        129,
        1005,
        1116
      ],
      "sha256": "9469295bda2146b3826cf7848f47a2d3b7bd6b3fa1f5a82db66836b75c9cdae5",
      "nativeWidth": 1254,
      "nativeHeight": 1254,
      "filename": "assets/damage-full-v1/washing_machine_cream/damage_heavy.png",
      "sizeBytes": 1054977
    }
  }
});
