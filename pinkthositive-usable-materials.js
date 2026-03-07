const COMMON_GLSL = `
float hash(float n){return fract(sin(n)*43758.5453123);}
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
mat2 rot2(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec3 p){
  float v=0.0;
  float a=0.5;
  for(int i=0;i<6;i++){
    v+=a*snoise(p);
    p*=2.03;
    a*=0.5;
  }
  return v;
}

float triplanarNoise(vec3 p, vec3 n, float scale){
  vec3 an=pow(abs(n),vec3(4.0));
  an/=max(an.x+an.y+an.z,0.0001);
  float nx=fbm(vec3(p.yz*scale,0.0));
  float ny=fbm(vec3(p.xz*scale,1.37));
  float nz=fbm(vec3(p.xy*scale,2.71));
  return nx*an.x+ny*an.y+nz*an.z;
}
`;

export const MATERIAL_VERT = `
varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main(){
  vUv=uv;
  vObjPos=position;
  vec4 world=modelMatrix*vec4(position,1.0);
  vWorldPos=world.xyz;
  vWorldNormal=normalize(normalMatrix*normal);
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

const ABYSS_PEARL = `
uniform float uTime;
uniform vec3 uLightDir;
varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
${COMMON_GLSL}

void main(){
  vec3 n=normalize(vWorldNormal);
  vec3 v=normalize(cameraPosition-vWorldPos);
  vec3 p=normalize(vObjPos);
  float swirl=fbm(p*4.0+uTime*0.05)*0.5+0.5;
  float band=0.5+0.5*sin((p.y+swirl*0.4)*28.0+snoise(p*6.0)*3.0);
  float shell=triplanarNoise(vObjPos*0.8,n,3.0)*0.5+0.5;
  float fres=pow(1.0-max(dot(n,v),0.0),3.4);
  vec3 base=mix(vec3(0.12,0.18,0.22),vec3(0.82,0.84,0.88),shell*0.7+0.15);
  vec3 iridescence=mix(vec3(0.22,0.68,0.92),vec3(1.0,0.54,0.76),band);
  base=mix(base,iridescence,0.24+fres*0.42);
  float diff=max(dot(n,normalize(uLightDir)),0.0);
  float spec=pow(max(dot(reflect(-normalize(uLightDir),n),v),0.0),52.0);
  vec3 col=base*(0.22+diff*0.88);
  col+=vec3(1.0,0.98,0.96)*spec*0.95;
  col+=vec3(0.22,0.86,1.0)*fres*0.18;
  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.94)),1.0);
}
`;

const BASILISK_SCALE = `
uniform float uTime;
uniform vec3 uLightDir;
varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
${COMMON_GLSL}

void main(){
  vec3 n=normalize(vWorldNormal);
  vec3 v=normalize(cameraPosition-vWorldPos);
  vec3 p=normalize(vObjPos);
  vec2 suv=vec2(atan(p.z,p.x)/6.28318530718+0.5,p.y*0.5+0.5);
  vec2 gv=suv*vec2(18.0,10.0);
  vec2 id=floor(gv);
  vec2 f=fract(gv)-0.5;
  f.x+=mod(id.y,2.0)*0.5-0.25;
  float scaleMask=smoothstep(0.52,0.18,length(vec2(f.x*1.2,f.y+0.16)));
  float ridge=smoothstep(0.42,0.05,length(vec2(f.x*1.08,f.y+0.08)));
  float veins=fbm(vec3(gv*0.6,uTime*0.05))*0.5+0.5;
  vec3 base=mix(vec3(0.05,0.08,0.05),vec3(0.12,0.26,0.09),scaleMask);
  base=mix(base,vec3(0.52,0.62,0.14),ridge*0.28);
  base+=vec3(0.08,0.05,0.0)*(veins-0.5)*0.8;
  float diff=max(dot(n,normalize(uLightDir)),0.0);
  float spec=pow(max(dot(reflect(-normalize(uLightDir),n),v),0.0),24.0);
  float fres=pow(1.0-max(dot(n,v),0.0),2.4);
  vec3 col=base*(0.18+diff*0.9);
  col+=mix(vec3(0.12,0.48,0.2),vec3(0.8,0.86,0.2),fres)*fres*0.16;
  col+=vec3(1.0,0.95,0.7)*spec*0.34;
  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.96)),1.0);
}
`;

const MAGMA_VEIN = `
uniform float uTime;
uniform vec3 uLightDir;
varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
${COMMON_GLSL}

void main(){
  vec3 n=normalize(vWorldNormal);
  vec3 v=normalize(cameraPosition-vWorldPos);
  vec3 p=vObjPos*1.3;
  float stone=triplanarNoise(p,n,2.1)*0.5+0.5;
  float cracks=abs(snoise(p*3.8+vec3(0.0,uTime*0.04,0.0)));
  cracks=smoothstep(0.74,0.9,cracks+stone*0.16);
  float ember=fbm(p*9.0+uTime*0.4)*0.5+0.5;
  vec3 rock=mix(vec3(0.04,0.04,0.05),vec3(0.2,0.2,0.22),stone);
  vec3 lava=mix(vec3(0.88,0.14,0.02),vec3(1.0,0.78,0.16),ember);
  float diff=max(dot(n,normalize(uLightDir)),0.0);
  float spec=pow(max(dot(reflect(-normalize(uLightDir),n),v),0.0),18.0);
  vec3 col=mix(rock,lava,cracks);
  col*=0.16+diff*0.92;
  col+=lava*cracks*1.15;
  col+=vec3(1.0,0.72,0.28)*spec*(0.06+cracks*0.18);
  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.94)),1.0);
}
`;

const CATHEDRAL_ALLOY = `
uniform float uTime;
uniform vec3 uLightDir;
varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
${COMMON_GLSL}

void main(){
  vec3 n=normalize(vWorldNormal);
  vec3 v=normalize(cameraPosition-vWorldPos);
  vec3 p=vObjPos;
  vec3 ap=abs(p);
  float panel=max(
    smoothstep(0.47,0.49,abs(fract(p.x*1.25)-0.5)),
    smoothstep(0.47,0.49,abs(fract(p.y*1.25)-0.5))
  );
  float engrave=0.5+0.5*sin((p.x+p.y)*10.0+snoise(p*4.0)*2.0);
  float goldMask=smoothstep(0.7,0.86,engrave)*(1.0-panel);
  vec3 metal=mix(vec3(0.16,0.18,0.22),vec3(0.7,0.74,0.8),pow(max(dot(n,vec3(0.0,1.0,0.0)),0.0),0.5)*0.25+0.2);
  metal+=vec3(0.08,0.22,0.36)*pow(max(1.0-ap.z*1.3,0.0),3.0)*0.3;
  vec3 gold=mix(vec3(0.34,0.24,0.08),vec3(0.98,0.78,0.34),goldMask);
  vec3 base=mix(metal,gold,goldMask*0.72);
  float diff=max(dot(n,normalize(uLightDir)),0.0);
  float spec=pow(max(dot(reflect(-normalize(uLightDir),n),v),0.0),42.0);
  float fres=pow(1.0-max(dot(n,v),0.0),4.0);
  vec3 col=base*(0.2+diff*0.92);
  col+=vec3(1.0,0.98,0.94)*spec*0.7;
  col+=vec3(0.12,0.46,0.92)*fres*0.18;
  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.95)),1.0);
}
`;

const STORMGLASS = `
uniform float uTime;
uniform vec3 uLightDir;
varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
${COMMON_GLSL}

void main(){
  vec3 n=normalize(vWorldNormal);
  vec3 v=normalize(cameraPosition-vWorldPos);
  vec3 p=vObjPos;
  float facets=pow(abs(dot(normalize(p),n)),10.0);
  float field=fbm(p*2.8+vec3(0.0,uTime*0.24,0.0))*0.5+0.5;
  float arc=smoothstep(0.55,0.9,abs(snoise(p*7.0+vec3(0.0,uTime*1.2,0.0))));
  float fres=pow(1.0-max(dot(n,v),0.0),3.0);
  vec3 glass=mix(vec3(0.04,0.09,0.18),vec3(0.36,0.78,0.98),field);
  glass+=vec3(0.7,0.9,1.0)*facets*0.4;
  float diff=max(dot(n,normalize(uLightDir)),0.0);
  float spec=pow(max(dot(reflect(-normalize(uLightDir),n),v),0.0),56.0);
  vec3 col=glass*(0.12+diff*0.7);
  col+=vec3(0.4,0.95,1.0)*arc*(0.25+fres*0.3);
  col+=vec3(1.0,0.98,0.96)*spec*0.95;
  col+=vec3(0.2,0.82,1.0)*fres*0.28;
  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.92)),1.0);
}
`;

const VOID_CORAL = `
uniform float uTime;
uniform vec3 uLightDir;
varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;
${COMMON_GLSL}

void main(){
  vec3 n=normalize(vWorldNormal);
  vec3 v=normalize(cameraPosition-vWorldPos);
  vec3 p=vObjPos*1.5;
  float body=triplanarNoise(p,n,2.6)*0.5+0.5;
  float pores=abs(snoise(p*5.4));
  float cavity=smoothstep(0.72,0.93,pores+body*0.1);
  float glow=fbm(p*7.0+uTime*0.18)*0.5+0.5;
  vec3 base=mix(vec3(0.12,0.03,0.08),vec3(0.58,0.14,0.32),body);
  base=mix(base,vec3(0.98,0.42,0.7),cavity*0.3);
  float diff=max(dot(n,normalize(uLightDir)),0.0);
  float spec=pow(max(dot(reflect(-normalize(uLightDir),n),v),0.0),20.0);
  float fres=pow(1.0-max(dot(n,v),0.0),2.8);
  vec3 col=base*(0.18+diff*0.85);
  col+=vec3(0.3,1.0,0.92)*cavity*glow*0.55;
  col+=vec3(1.0,0.84,0.9)*spec*0.25;
  col+=vec3(0.28,0.96,0.86)*fres*0.12;
  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.94)),1.0);
}
`;

export const PINKTHOSITIVE_USABLE_MATERIALS = [
  {
    id: "abyss_pearl",
    title: "Abyss Pearl",
    category: "Organic Mineral",
    artifactType: "Material Study",
    targetUse: "Boss relic, underwater shrine prop, premium orb surface",
    exportPath: "Bake albedo + roughness + normal from live preview",
    geometry: "sphere",
    description: "Wet nacre with layered interference bands and cold rim iridescence.",
    metaPrompt: [
      "Subject: premium nacre material with pearl depth",
      "Artifact: reusable material on real geometry",
      "Primary read: shell layering, wet sheen, opalescent rim",
      "Avoid: plain chrome ball"
    ],
    fragmentShader: ABYSS_PEARL
  },
  {
    id: "basilisk_scale",
    title: "Basilisk Scale",
    category: "Creature Armor",
    artifactType: "Material Study",
    targetUse: "Reptile hide, creature boss armor, fantasy shield skin",
    exportPath: "Bake color/roughness/normal to creature UV set",
    geometry: "sphere",
    description: "Readable scale rows with green-gold highlights and hard reptilian specular.",
    metaPrompt: [
      "Subject: creature armor surface, not abstract green noise",
      "Artifact: reusable skin material",
      "Primary read: scale rows, hard ridges, reptile sheen",
      "Avoid: slime blob"
    ],
    fragmentShader: BASILISK_SCALE
  },
  {
    id: "magma_vein_basalt",
    title: "Magma Vein Basalt",
    category: "Volcanic Surface",
    artifactType: "Material Study",
    targetUse: "Lava cave rocks, weapon core, volcanic shrine floor",
    exportPath: "Bake emissive + albedo + roughness for game materials",
    geometry: "icosahedron",
    description: "Dense basalt with bright lava fissures that read as actual internal heat, not random orange noise.",
    metaPrompt: [
      "Subject: volcanic stone with internal heat",
      "Artifact: reusable emissive rock material",
      "Primary read: dark basalt mass, hot fissures, ember variation",
      "Avoid: generic lava wallpaper"
    ],
    fragmentShader: MAGMA_VEIN
  },
  {
    id: "cathedral_alloy",
    title: "Cathedral Alloy",
    category: "Ceremonial Hard-Surface",
    artifactType: "Material Study",
    targetUse: "Sci-fi temple trim, premium door panels, relic machinery",
    exportPath: "Bake panel masks, albedo, metalness, and roughness",
    geometry: "box",
    description: "Ornate brushed alloy with inset gold channels and cool specular edges.",
    metaPrompt: [
      "Subject: ceremonial metal panel, not flat sci-fi grey",
      "Artifact: reusable hard-surface material",
      "Primary read: panel structure, gold inlays, cool metal specular",
      "Avoid: bland brushed metal"
    ],
    fragmentShader: CATHEDRAL_ALLOY
  },
  {
    id: "stormglass_core",
    title: "Stormglass Core",
    category: "Crystal Energy",
    artifactType: "Material Study",
    targetUse: "Power crystal, pickup, reactor shard, magical node",
    exportPath: "Bake albedo/emissive/roughness or rebuild in engine shader graph",
    geometry: "octahedron",
    description: "Electric cyan crystal with faceted edges, internal charge patterns, and glassy highlights.",
    metaPrompt: [
      "Subject: energized crystal material on faceted geometry",
      "Artifact: reusable crystal material",
      "Primary read: facets, internal energy, cold glass rim",
      "Avoid: plain blue glass"
    ],
    fragmentShader: STORMGLASS
  },
  {
    id: "void_coral",
    title: "Void Coral",
    category: "Alien Organic",
    artifactType: "Material Study",
    targetUse: "Alien reef, bio-architecture, creature nest growth",
    exportPath: "Bake color/emissive/roughness for environment assets",
    geometry: "torusknot",
    description: "Porous magenta coral tissue with glowing cavities and fleshy depth.",
    metaPrompt: [
      "Subject: alien coral that reads from pores and body mass",
      "Artifact: reusable organic environment material",
      "Primary read: cavities, soft flesh tone, inner glow",
      "Avoid: pink marble"
    ],
    fragmentShader: VOID_CORAL
  }
];
