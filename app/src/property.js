import calibration from './calibration.json';
// Metres, Y up. Plan north is -Z. Room clear dimensions are prioritized over
// the indicative drawing's pixels; see reference/accuracy.md for reconciliation.
export const property={address:'Danish Villa',city:'Denmark',listedArea:140,sourceDate:'16 September 2020',livingHeight:2.67};
export const rooms=[
 {id:'hall',name:'Entrance',subtitle:'Front door & connecting hall',bounds:[4.92,0,6.79,4.08],spawn:[5.88,1.0],look:[5.88,4.3],plan:[410,112,496,334],photos:[9950,9951],floor:'tile',ceiling:'flat',height:2.45},
 {id:'kitchen',name:'Kitchen & dining',subtitle:'L-shaped kitchen · glazed terrace door',bounds:[0,4.20,7.78,8.01],spawn:[6.15,6.95],look:[1.4,6.25],plan:[138,334,554,554],photos:[9941,9942,9953,9958,9959],floor:'tile',ceiling:'gableX',height:2.96,eave:2.30},
 {id:'living',name:'Living room',subtitle:'Garden-facing windows · 5.92 × 5.00 m',bounds:[5.45,8.13,11.37,13.13],spawn:[6.5,9.10],look:[9.7,11.5],plan:[415,554,752,837],photos:[9939,9940,9952,9956],floor:'wood',ceiling:'gableZ',height:2.67,eave:2.32},
 {id:'primary',name:'Main bedroom',subtitle:'4.46 × 4.08 m · two east windows',bounds:[6.91,0,11.37,4.08],spawn:[7.52,2.75],look:[10.1,2.04],plan:[496,112,752,334],photos:[9944,9945],floor:'bedTile',ceiling:'gableX',height:2.95,eave:2.3},
 {id:'office',name:'Office / bedroom',subtitle:'3.47 × 3.81 m · east-facing window',bounds:[7.90,4.20,11.37,8.01],spawn:[8.48,6.45],look:[10.6,6.2],plan:[554,334,752,554],photos:[9957],floor:'wood',ceiling:'gableX',height:2.9,eave:2.3},
 {id:'bathroom',name:'Main bathroom',subtitle:'Double basin · twin shower · fitted storage',bounds:[2.52,0,4.8,2.50],extra:[[2.52,2.50,3.56,4.08]],spawn:[4.20,1.8],look:[2.82,1.05],plan:[278,112,410,256],photos:[9946,9947,9948,9954],floor:'bathTile',ceiling:'flat',height:2.5},
 {id:'wc',name:'Guest WC',subtitle:'Compact basin & concealed cistern',bounds:[3.68,2.62,4.80,4.08],spawn:[4.85,3.25],look:[3.85,3.27],plan:[335,256,398,334],photos:[9949,9955],floor:'bathTile',ceiling:'flat',height:2.4},
 {id:'utility',name:'Utility room',subtitle:'Opposing cabinet runs · laundry & sink',bounds:[0,0,2.40,4.08],spawn:[1.24,1.05],look:[1.1,3.4],plan:[138,112,278,334],photos:[9943],floor:'tile',ceiling:'flat',height:2.45},
];
// Wall openings are authored once. Their geometry, collision and review
// inventory are generated from this same definition, avoiding stray windows.
const W=(id,a,b,sill,head,refs,extra={})=>({id,a,b,kind:'window',sill,head,refs,confidence:'Photo + plan; dimensions estimated',...extra});
const D=(id,a,b,refs,extra={})=>({id,a,b,kind:'door',sill:0,head:2.10,refs,confidence:'Photo + plan; width estimated',...extra});
export const walls=[
 {id:'north',axis:'x',at:-.12,start:-.12,end:11.49,outer:true,inside:1,openings:[D('utility-entry',.95,1.81,[9937,9961],{room:'utility'}),W('bath-high-window',3.55,4.02,1.78,2.16,[9946,9947],{room:'bathroom',opaque:true}),D('front-door',5.18,6.08,[9950,9951],{room:'hall'}),W('bedroom-north-window',7.05,8.05,.85,2.12,[9944],{room:'primary'})]},
 {id:'west',axis:'z',at:-.12,start:-.12,end:8.13,outer:true,inside:1,openings:[W('utility-strip-window',.94,2.43,1.14,1.67,[9943],{room:'utility'})]},
 {id:'east',axis:'z',at:11.49,start:-.12,end:13.25,outer:true,inside:-1,openings:[W('bedroom-east-a',.42,1.47,.83,2.11,[9945],{room:'primary'}),W('bedroom-east-b',2.62,3.71,.83,2.11,[9945],{room:'primary'}),W('office-east',5.73,6.78,.84,2.12,[9957],{room:'office'}),W('living-east-high-a',9.35,10.38,1.76,2.16,[9952],{room:'living'}),W('living-east-high-b',11.58,12.62,1.76,2.16,[9952],{room:'living'})]},
 {id:'kitchen-south',axis:'x',at:8.13,start:-.12,end:5.33,outer:true,inside:-1,openings:[W('kitchen-garden-window',1.02,3.63,.94,2.15,[9941,9942,9953,9958],{room:'kitchen',divisions:[.333,.667],transom:1.72}),D('kitchen-terrace-door',3.73,4.58,[9941,9958],{room:'kitchen',glazed:true})]},
 {id:'living-west',axis:'z',at:5.33,start:8.13,end:13.25,outer:true,inside:1,openings:[D('living-garden-door',10.15,10.99,[9939,9956],{room:'living',glazed:true}),W('living-west-window',11.19,13.0,.65,2.16,[9939,9956],{room:'living',divisions:[],transom:1.30})]},
 {id:'living-south',axis:'x',at:13.25,start:5.33,end:11.49,outer:true,inside:-1,openings:[W('living-south-a',5.62,7.85,.67,2.16,[9940,9960],{room:'living',divisions:[.5],transom:1.6}),W('living-south-b',8.83,11.16,.67,2.16,[9940],{room:'living',divisions:[.5],transom:1.6})]},
 {id:'utility-bath',axis:'z',at:2.46,start:-.12,end:4.14,openings:[]},
 {id:'bath-hall',axis:'z',at:4.86,start:-.12,end:4.14,openings:[D('bath-door',1.28,2.11,[9946,9950],{room:'bathroom',swing:1}),D('wc-door',2.83,3.63,[9949,9955],{room:'wc',swing:-1,hingeEnd:true})]},
 {id:'hall-primary',axis:'z',at:6.85,start:-.12,end:4.14,openings:[D('bedroom-door',2.25,3.12,[9944,9945],{room:'primary',swing:1})]},
 {id:'north-south-divider',axis:'x',at:4.14,start:-.12,end:11.49,openings:[D('utility-kitchen-door',.95,1.82,[9943],{room:'utility',swing:-1}),D('hall-double-door',5.02,6.60,[9950,9951,9959],{room:'hall',double:true,glazed:true})]},
 {id:'office-west',axis:'z',at:7.84,start:4.14,end:8.07,openings:[D('office-door',5.57,6.42,[9957,9959],{room:'office',swing:1})]},
 {id:'office-south',axis:'x',at:8.07,start:7.84,end:11.49,openings:[]},
 {id:'wc-north',axis:'x',at:2.56,start:3.62,end:4.86,openings:[]},
 {id:'wc-west',axis:'z',at:3.62,start:2.56,end:4.14,openings:[]},
];
// Cabinet front faces local +Z. Rotation: 0=north wall, pi/2=west wall.
export const cabinets=[
 {id:'kitchen-west-base',room:'kitchen',x:.32,z:6.57,w:2.65,d:.62,h:.86,y:0,angle:Math.PI/2,doors:5,worktop:true,refs:[9942,9958],note:'Five approximate modules along the hob wall; white framed fronts'},
 {id:'kitchen-west-upper',room:'kitchen',x:.19,z:6.55,w:2.68,d:.34,h:.73,y:1.48,angle:Math.PI/2,doors:5,refs:[9958],note:'Upper cabinets; hood integrated above hob'},
 {id:'kitchen-oven-tower',room:'kitchen',x:.32,z:4.68,w:.62,d:.62,h:2.24,y:0,angle:Math.PI/2,doors:1,oven:true,refs:[9958],note:'Stacked ovens in tall housing beside the north end of hob run'},
 {id:'kitchen-sink-base',room:'kitchen',x:2.05,z:7.68,w:2.90,d:.62,h:.86,y:0,angle:Math.PI,doors:5,worktop:true,sink:true,refs:[9942,9958],note:'Counter and sink below the garden window'},
 {id:'kitchen-display-base',room:'kitchen',x:3.65,z:4.49,w:2.10,d:.57,h:.86,y:0,angle:0,doors:4,worktop:true,refs:[9958,9959],note:'Storage counter along the north wall, beside the hall doors'},
 {id:'kitchen-display-upper',room:'kitchen',x:3.65,z:4.38,w:2.10,d:.34,h:.70,y:1.49,angle:0,doors:4,glass:true,refs:[9958,9959],note:'Glazed wall cupboards above north storage counter'},
 {id:'utility-west-base',room:'utility',x:.32,z:1.76,w:2.70,d:.62,h:.86,y:0,angle:Math.PI/2,doors:5,worktop:true,sink:true,refs:[9943],note:'Sink and drawer run below the horizontal west window'},
 {id:'utility-west-upper',room:'utility',x:.18,z:1.70,w:2.66,d:.34,h:.55,y:1.79,angle:Math.PI/2,doors:5,refs:[9943],note:'Upper cabinets above strip window'},
 {id:'utility-east-laundry',room:'utility',x:2.09,z:1.08,w:1.28,d:.61,h:2.26,y:0,angle:-Math.PI/2,doors:2,laundry:true,refs:[9943],note:'Side-by-side raised washer/dryer with storage above; appliance size estimated'},
 {id:'utility-west-fridge',room:'utility',x:.34,z:3.58,w:.66,d:.65,h:2.18,y:0,angle:Math.PI/2,doors:1,refs:[9943],note:'Tall refrigerator near kitchen doorway'},
 {id:'bath-vanity',room:'bathroom',x:2.79,z:1.13,w:1.44,d:.52,h:.56,y:.27,angle:Math.PI/2,doors:2,vanity:true,refs:[9946,9947,9954],note:'Wall-hung four-drawer vanity, two basins on the west wall'},
 {id:'bath-linen-cabinet',room:'bathroom',x:4.13,z:2.25,w:1.12,d:.44,h:2.06,y:.12,angle:Math.PI,doors:3,glass:true,refs:[9948,9954],note:'Three-door fitted towel cupboard beside shower opening'},
 {id:'wc-vanity',room:'wc',x:4.20,z:2.83,w:.54,d:.40,h:.80,y:0,angle:0,doors:1,vanity:true,refs:[9949,9955],note:'Small basin cabinet on north WC wall'},
 {id:'bedroom-north-wardrobe',room:'primary',x:9.0,z:.31,w:1.74,d:.60,h:2.20,y:0,angle:0,doors:3,plain:true,refs:[9944,9945],note:'North-side wardrobe next to the separate north window; extent photo-estimated'},
 {id:'bedroom-south-wardrobe',room:'primary',x:8.2,z:3.78,w:1.90,d:.60,h:2.20,y:0,angle:Math.PI,doors:3,plain:true,refs:[9945],note:'Opposing wardrobe near bedroom entry; extent partly obscured'},
];
export const accuracyNotes=[
 'Main plan IMG_9962 is used. IMG_9964 is an alternative layout and is excluded.',
 'The owner confirmed the supplied main layout and photos, with no known changes.',
 'Clear bedroom dimensions follow 4.46 × 4.08 m and 3.47 × 3.81 m; living follows 5.92 × 5.00 m.',
 'North clear widths plus estimated 0.12 m partitions imply 11.37 m overall clear width. This makes the kitchen/alrum span approximately 7.78 m, versus a 7.57 m label on the indicative plan. Survey measurements are needed to reconcile that 0.21 m difference.',
 'Ceiling height H:267 is printed in the living room. Its interpretation as the highest ceiling point is an assumption. Other eave/ridge heights are photo estimates.',
 'Window and door existence is checked against the plan and photos. Opening widths, offsets, sill heights, cabinet depths and module widths are estimates, not site measurements.',
 'No electrical outlets or switches are modeled. Original documents and pricing are not published in the walkthrough.',
];

// The 1.87 m entrance label belongs to the wider end beside the WC notch.
// Kitchen 7.57 + partition .12 + office 3.47 constrain the total to 11.16 m.
// Keeping the north utility, bathroom and bedroom labels gives 1.66 m at
// the upper entrance. The 0.21 m notch depth is inferred, not surveyed.
for(const r of rooms){
 if(['primary','office','living'].includes(r.id)){r.bounds[0]-=.21;r.bounds[2]-=.21;r.spawn[0]-=.21;r.look[0]-=.21;}
 if(r.id==='kitchen'){r.bounds[2]=7.57;r.spawn[0]-=.10;}
 if(r.id==='hall'){r.bounds[2]=6.58;r.extra=[[4.71,3.69,4.92,4.08]];r.spawn[0]-=.105;r.look[0]-=.105;}
 if(r.id==='wc'){r.bounds[3]=3.57;r.extra=[[3.68,3.57,4.59,4.08]];}
}
for(const w of walls){
 if(['east','living-west','hall-primary','office-west'].includes(w.id))w.at-=.21;
 if(['north','kitchen-south','north-south-divider'].includes(w.id))w.end-=.21;
 if(['living-south','office-south'].includes(w.id)){w.start-=.21;w.end-=.21;}
 if(w.id==='living-south')for(const o of w.openings){o.a-=.21;o.b-=.21;}
 if(w.id==='north'){const o=w.openings.find(o=>o.id==='bedroom-north-window');o.a-=.21;o.b-=.21;}
 if(w.id==='north-south-divider')w.openings.find(o=>o.id==='hall-double-door').b-=.21;
 if(w.id==='bath-hall')w.end=3.63;
}
walls.push({id:'wc-hall-return',axis:'x',at:3.63,start:4.65,end:4.86,openings:[]},{id:'wc-hall-step',axis:'z',at:4.65,start:3.63,end:4.14,openings:[]});
for(const c of cabinets)if(c.room==='primary')c.x-=.21;
accuracyNotes[3]='The hall is stepped beside the guest WC. Its 1.87 m label is assigned to the wider end. Keeping the kitchen (7.57 m), office (3.47 m), primary bedroom (4.46 m), bathroom (2.28 m) and utility (2.40 m) labels gives an upper hall width of 1.66 m and an inferred 0.21 m step. This reconciles the previous span conflict, but the step and wall thicknesses still need measurement.';

// Apply local plan measurements before geometry, light fills and navigation are built.
for(const wall of walls)for(const opening of wall.openings){const measure=calibration.find(m=>m.id===opening.id);if(measure){opening.a=measure.a;opening.b=measure.b;opening.measurement=measure;opening.confidence=`Locally scaled main plan; horizontal uncertainty approximately ±${Math.round(measure.uncertainty_m*100)} cm; heights photo-estimated`;}}
accuracyNotes.push('Sixteen opening widths/offsets were recalibrated using local wall ratios and labelled dimensions. Estimated horizontal uncertainties are 5–10 cm, not survey tolerances. See the measurement report for pixel endpoints and derivation.');

// Explicit handing read from the swing arcs in the supplied MAIN plan.
// a/b are the lower/upper coordinate jambs, not viewer-dependent left/right.
export const doorSchedule={
 'utility-entry':{hinge:'b',opensTo:'south'},
 'front-door':{hinge:'b',opensTo:'north'},
 'kitchen-terrace-door':{hinge:'a',opensTo:'south'},
 'living-garden-door':{hinge:'b',opensTo:'west'},
 'bath-door':{hinge:'b',opensTo:'west'},
 'wc-door':{hinge:'a',opensTo:'east'},
 'bedroom-door':{hinge:'a',opensTo:'east'},
 'utility-kitchen-door':{hinge:'b',opensTo:'north'},
 'hall-double-door':{hinge:'both',opensTo:'south'},
 'office-door':{hinge:'a',opensTo:'east'},
};
for(const wall of walls)for(const opening of wall.openings)if(opening.kind==='door'){
 const handing=doorSchedule[opening.id];if(!handing)throw Error('Missing door handing: '+opening.id);
 Object.assign(opening,handing,{openDegrees:90});delete opening.swing;delete opening.hingeEnd;
}
accuracyNotes.push('Door hinge jambs and opening sides follow the main plan swing arcs, cross-checked with visible photo hinges. Leaves are displayed at 90 degrees for navigation; this display angle is not a measured opening limit.');

export const doorsClosed=new URLSearchParams(location.search).get('doors')==='closed';
if(doorsClosed){for(const w of walls)for(const o of w.openings)if(o.kind==='door')o.openDegrees=0;rooms.find(r=>r.id==='wc').spawn=[4.26,3.23];}
// Owner confirmed the tall white fridge immediately south of the stacked ovens.
cabinets.push({id:'kitchen-fridge',room:'kitchen',x:.32,z:5.32,w:.62,d:.62,h:2.24,y:0,angle:Math.PI/2,doors:1,fridge:true,refs:[9958],note:'Integrated white fridge/freezer beside stacked ovens; location owner-confirmed, 60 cm module estimated.'});
for(const c of cabinets){if(c.id==='kitchen-west-base'||c.id==='kitchen-west-upper'){c.z=6.78;c.w=2.22;c.doors=4;}if(c.id==='kitchen-sink-base')c.sinkOffset=.65;}
accuracyNotes.push('Garden boundary and roof outlines use Matriklen/GeoDanmark data via Grundviden, registered approximately to the main house. Plot is about 20.6 × 38 m. Surface edges, wall heights and unseen colours remain photo-based estimates.');
