import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {meshopt,textureCompress,prune,dedup} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
import {stat,writeFile} from 'node:fs/promises';
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node optimize.mjs input.glb output.glb');
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(input);const before={materials:doc.getRoot().listMaterials().length,meshes:doc.getRoot().listMeshes().length,bytes:(await stat(input)).size};
// Lossless WebP preserves normal/roughness data; meshopt is quantized finely
// enough for millimetre-scale architecture. The lightmap UV needs 16 bits.
await doc.transform(dedup({propertyTypes:['Texture']}),textureCompress({encoder:sharp,targetFormat:'webp',lossless:true}),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16}),prune({keepAttributes:true,keepExtras:true}));
await io.write(output,doc);const report={before,after:{bytes:(await stat(output)).size,materials:doc.getRoot().listMaterials().length,meshes:doc.getRoot().listMeshes().length},geometry:'Meshopt; 16-bit position and UV quantization; no geometry simplification',textures:'lossless WebP'};await writeFile(output+'.json',JSON.stringify(report,null,2));console.log(report);
