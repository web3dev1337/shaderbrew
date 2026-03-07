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

float sdBox(vec3 p,vec3 b){
  vec3 q=abs(p)-b;
  return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);
}

float sdOcta(vec3 p,float s){
  p=abs(p);
  return (p.x+p.y+p.z-s)*0.57735027;
}

float opUnion(float a,float b){return min(a,b);}
`;

const PRISM_CATHEDRAL = `
uniform float time;
uniform vec2 resolution;
${COMMON_GLSL}

vec2 opU(vec2 a,vec2 b){return a.x<b.x?a:b;}

vec2 mapScene(vec3 p){
  vec2 res=vec2(1e5,0.0);
  float floorPlane=p.y+1.42;
  res=opU(res,vec2(floorPlane,1.0));

  vec3 q=p;
  q.z+=time*2.2;
  float cellIndex=floor((q.z+2.5)/5.0);
  q.z=mod(q.z+2.5,5.0)-2.5;

  float columns=sdBox(vec3(abs(q.x)-2.7,q.y-0.2,q.z),vec3(0.26,1.76,0.26));
  res=opU(res,vec2(columns,2.0));

  float archTop=sdBox(vec3(q.x,q.y-1.82,q.z),vec3(2.96,0.12,0.24));
  res=opU(res,vec2(archTop,3.0));

  float archSides=sdBox(vec3(abs(q.x)-2.18,q.y-1.18,q.z),vec3(0.12,0.54,0.24));
  res=opU(res,vec2(archSides,3.0));

  vec3 spine=q;
  spine.z=mod(spine.z+1.25,2.5)-1.25;
  float crystal=sdOcta(vec3(spine.x,spine.y+0.5,spine.z),0.92);
  crystal=max(crystal,-(spine.y+1.3));
  res=opU(res,vec2(crystal,4.0));

  float rail=sdBox(vec3(abs(p.x)-1.15,p.y+0.76,mod(p.z+0.4,1.5)-0.75),vec3(0.06,0.04,0.36));
  res=opU(res,vec2(rail,5.0));

  return res;
}

vec3 calcNormal(vec3 p){
  vec2 e=vec2(0.0015,0.0);
  return normalize(vec3(
    mapScene(p+e.xyy).x-mapScene(p-e.xyy).x,
    mapScene(p+e.yxy).x-mapScene(p-e.yxy).x,
    mapScene(p+e.yyx).x-mapScene(p-e.yyx).x
  ));
}

float trace(vec3 ro,vec3 rd,out float matId,out vec3 hit){
  float t=0.0;
  matId=0.0;
  for(int i=0;i<120;i++){
    hit=ro+rd*t;
    vec2 d=mapScene(hit);
    if(d.x<0.0015||t>44.0){
      matId=d.y;
      break;
    }
    t+=d.x*0.7;
  }
  return t;
}

vec3 materialColor(float matId,vec3 p,vec3 n,vec3 rd){
  vec3 keyDir=normalize(vec3(-0.45,0.72,-0.52));
  float diff=max(dot(n,keyDir),0.0);
  float rim=pow(1.0-max(dot(n,-rd),0.0),3.0);
  float spec=pow(max(dot(reflect(-keyDir,n),-rd),0.0),24.0);
  vec3 col=vec3(0.0);

  if(matId<1.5){
    float lane=0.5+0.5*sin(p.z*5.0-time*3.6);
    float seam=smoothstep(0.95,0.2,abs(fract(p.z*0.24)-0.5));
    col=mix(vec3(0.03,0.05,0.08),vec3(0.05,0.11,0.16),lane);
    col+=vec3(0.05,0.34,0.62)*pow(seam,5.0)*0.35;
    col+=vec3(0.65,0.74,0.82)*spec*0.16;
  }else if(matId<2.5){
    col=mix(vec3(0.22,0.25,0.31),vec3(0.75,0.8,0.86),diff*0.7+0.2);
    col+=vec3(0.25,0.75,1.0)*pow(max(0.0,1.0-abs(p.z)*1.5),4.0)*0.16;
  }else if(matId<3.5){
    col=mix(vec3(0.22,0.17,0.09),vec3(0.94,0.79,0.43),diff*0.8+0.2);
    col+=vec3(1.0,0.86,0.52)*spec*0.25;
  }else if(matId<4.5){
    float pulse=0.5+0.5*sin(time*2.4+p.z*1.8);
    col=mix(vec3(0.08,0.18,0.28),vec3(0.62,0.93,1.0),pulse);
    col+=vec3(0.75,0.96,1.0)*spec*0.35;
  }else{
    col=mix(vec3(0.16,0.14,0.18),vec3(0.72,0.46,0.24),diff*0.6+0.2);
  }

  col*=0.22+diff*0.95;
  col+=vec3(0.08,0.24,0.42)*rim*0.5;
  return col;
}

void main(){
  vec2 uv=(gl_FragCoord.xy/resolution.xy)*2.0-1.0;
  uv.x*=resolution.x/resolution.y;
  vec3 ro=vec3(0.0,0.25,-6.0);
  ro.x+=sin(time*0.23)*0.45;
  ro.y+=sin(time*0.11)*0.12;
  vec3 ta=vec3(0.0,0.1,2.0);
  vec3 ww=normalize(ta-ro);
  vec3 uu=normalize(cross(vec3(0.0,1.0,0.0),ww));
  vec3 vv=normalize(cross(ww,uu));
  vec3 rd=normalize(uu*uv.x+vv*uv.y+ww*1.65);

  float matId;
  vec3 hit=ro;
  float t=trace(ro,rd,matId,hit);
  vec3 col=vec3(0.005,0.008,0.018);

  if(t<44.0){
    vec3 n=calcNormal(hit);
    col=materialColor(matId,hit,n,rd);
    float fog=exp(-t*0.055);
    col=mix(vec3(0.01,0.02,0.05),col,fog);
  }

  float scan=pow(max(0.0,1.0-abs(uv.y+0.08)*1.4),3.0);
  col+=vec3(0.08,0.28,0.52)*scan*0.06;
  col=pow(max(col,0.0),vec3(0.92));
  gl_FragColor=vec4(col,1.0);
}
`;

const STELLAR_ORCHID = `
uniform float time;
uniform vec2 resolution;
${COMMON_GLSL}

float starfield(vec2 uv,float scale){
  vec2 gv=uv*scale;
  vec2 id=floor(gv);
  vec2 f=fract(gv)-0.5;
  float h=hash21(id);
  float star=smoothstep(0.995,1.0,h);
  return star*exp(-dot(f,f)*26.0);
}

void main(){
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec2 p=(uv-0.5)*2.0;
  p.x*=resolution.x/resolution.y;

  vec2 q=p;
  q*=1.0+0.05*sin(time*0.15);
  float r=length(q);

  vec3 col=vec3(0.02,0.02,0.055);
  float neb=fbm(vec3(q*1.2,time*0.08))*0.5+0.5;
  col+=mix(vec3(0.05,0.07,0.16),vec3(0.12,0.04,0.11),neb)*(1.0-smoothstep(0.2,1.6,r));
  col+=vec3(0.65,0.78,1.0)*starfield(p+vec2(time*0.01,0.0),60.0)*0.35;
  col+=vec3(1.0,0.86,0.75)*starfield(p*1.3-vec2(0.0,time*0.02),90.0)*0.2;

  for(int i=0;i<5;i++){
    float fi=float(i);
    float layer=fi/4.0;
    vec2 lp=q*(1.0+layer*0.24);
    lp*=rot2(time*0.07*(0.4+layer)+fi*0.7);
    float lr=length(lp);
    float la=atan(lp.y,lp.x);
    float warp=fbm(vec3(vec2(cos(la),sin(la))*2.5,layer*2.0+time*0.12));
    float petals=pow(0.5+0.5*cos(la*(7.0+fi)+warp*1.8-time*(0.4+layer)),2.2);
    float petalRadius=0.2+layer*0.16+petals*(0.22+layer*0.05);
    float edge=smoothstep(petalRadius+0.07,petalRadius-0.03,lr);
    float hollow=smoothstep(0.12+layer*0.035,0.25+layer*0.06,lr);
    edge*=hollow;
    vec3 petalColor=mix(
      mix(vec3(0.24,0.08,0.16),vec3(0.88,0.24,0.44),layer),
      mix(vec3(0.22,0.68,0.95),vec3(1.0,0.82,0.44),petals),
      0.42
    );
    col+=petalColor*edge*(0.26+layer*0.1);
    col+=vec3(0.18,0.88,1.0)*pow(edge,2.4)*(0.035+0.03*layer);
  }

  float throat=exp(-r*r*26.0);
  float throatNoise=fbm(vec3(q*8.0,time*0.5))*0.5+0.5;
  col+=mix(vec3(0.74,0.18,0.28),vec3(1.0,0.86,0.4),throatNoise)*throat*0.42;
  float core=exp(-r*r*170.0);
  col+=vec3(1.0,0.78,0.46)*core*0.18;

  float filaments=0.0;
  for(int i=0;i<10;i++){
    float fi=float(i);
    float ang=fi*0.62831853+sin(time*0.35+fi)*0.08;
    vec2 dir=vec2(cos(ang),sin(ang));
    vec2 cp=q-dir*0.18;
    float stem=exp(-pow(length(vec2(dot(cp,vec2(-dir.y,dir.x))*4.0,dot(cp,dir)-0.18)),2.0)*5.0);
    filaments=max(filaments,stem);
  }
  col+=vec3(0.98,0.78,0.55)*filaments*0.18;

  float halo=exp(-pow(r*1.35,1.55))*0.35;
  col+=vec3(0.14,0.36,0.86)*halo;
  col=pow(max(col,0.0),vec3(0.92));
  gl_FragColor=vec4(col,1.0);
}
`;

const OBSIDIAN_MONSOON = `
uniform float time;
uniform vec2 resolution;
${COMMON_GLSL}

vec2 opU(vec2 a,vec2 b){return a.x<b.x?a:b;}

vec2 mapScene(vec3 p){
  vec2 res=vec2(1e5,0.0);
  float ground=p.y+1.3+fbm(vec3(p.x*0.15,0.0,p.z*0.15))*0.16;
  res=opU(res,vec2(ground,1.0));

  vec2 cell=floor((p.xz+2.0)/4.0);
  vec2 local=mod(p.xz+2.0,4.0)-2.0;
  float h=1.2+hash21(cell*0.73+4.0)*4.4;
  vec3 mp=vec3(local.x,p.y-(h*0.5-1.3),local.y);
  float width=0.14+hash21(cell+7.3)*0.14;
  float slab=sdBox(mp,vec3(width,h*0.5,width+0.05));
  res=opU(res,vec2(slab,2.0));

  float shard=sdBox(vec3(local.x*0.8,p.y-(h*0.66-0.8),local.y),vec3(width*0.55,h*0.18,width*0.34));
  res=opU(res,vec2(shard,3.0));
  return res;
}

vec3 calcNormal(vec3 p){
  vec2 e=vec2(0.002,0.0);
  return normalize(vec3(
    mapScene(p+e.xyy).x-mapScene(p-e.xyy).x,
    mapScene(p+e.yxy).x-mapScene(p-e.yxy).x,
    mapScene(p+e.yyx).x-mapScene(p-e.yyx).x
  ));
}

float trace(vec3 ro,vec3 rd,out float matId,out vec3 hit){
  float t=0.0;
  matId=0.0;
  for(int i=0;i<110;i++){
    hit=ro+rd*t;
    vec2 d=mapScene(hit);
    if(d.x<0.002||t>55.0){
      matId=d.y;
      break;
    }
    t+=d.x*0.75;
  }
  return t;
}

float rain(vec2 uv,float seed,float speed){
  vec2 gv=uv;
  gv.x+=sin(gv.y*5.0+seed)*0.08;
  gv.y+=time*speed;
  vec2 id=floor(gv);
  vec2 f=fract(gv)-0.5;
  float h=hash21(id+seed);
  float lane=smoothstep(0.82,1.0,h);
  float drop=exp(-f.x*f.x*55.0)*smoothstep(0.52,-0.46,f.y);
  return lane*drop;
}

void main(){
  vec2 uv=(gl_FragCoord.xy/resolution.xy)*2.0-1.0;
  uv.x*=resolution.x/resolution.y;
  vec3 ro=vec3(0.0,-0.2,-6.8);
  ro.x+=sin(time*0.18)*0.8;
  vec3 ta=vec3(0.0,-0.65,4.0);
  vec3 ww=normalize(ta-ro);
  vec3 uu=normalize(cross(vec3(0.0,1.0,0.0),ww));
  vec3 vv=normalize(cross(ww,uu));
  vec3 rd=normalize(uu*uv.x+vv*(uv.y*0.86)+ww*1.7);

  float matId;
  vec3 hit=ro;
  float t=trace(ro,rd,matId,hit);

  vec3 sky=mix(vec3(0.02,0.03,0.06),vec3(0.05,0.14,0.24),smoothstep(-0.35,0.95,uv.y));
  float aurora=fbm(vec3(uv.x*1.5,uv.y*2.5,time*0.08));
  sky+=mix(vec3(0.05,0.28,0.48),vec3(0.92,0.22,0.46),smoothstep(0.2,0.9,aurora))*pow(max(0.0,1.0-abs(uv.y-0.24)*2.4),3.0)*0.52;
  sky+=vec3(0.22,0.09,0.12)*pow(max(0.0,1.0-abs(uv.y+0.42)*3.6),4.0)*0.9;
  float lightning=pow(max(0.0,sin(time*0.8)+0.55*sin(time*1.7+1.2)),16.0);
  sky+=vec3(0.72,0.86,1.0)*lightning*0.35;
  vec3 col=sky;

  if(t<55.0){
    vec3 n=calcNormal(hit);
    vec3 keyDir=normalize(vec3(-0.62,0.72,-0.2));
    float diff=max(dot(n,keyDir),0.0);
    float fres=pow(1.0-max(dot(n,-rd),0.0),4.0);
    float spec=pow(max(dot(reflect(-keyDir,n),-rd),0.0),38.0);

    if(matId<1.5){
      float wet=0.5+0.5*fbm(vec3(hit.x*0.5,hit.z*0.5,time*0.08));
      col=mix(vec3(0.04,0.04,0.07),vec3(0.1,0.12,0.17),wet);
      col+=vec3(0.12,0.58,0.92)*spec*0.75;
      col+=sky*fres*0.38;
    }else if(matId<2.5){
      col=mix(vec3(0.06,0.06,0.08),vec3(0.24,0.24,0.28),diff*0.7+0.12);
      col+=mix(vec3(0.1,0.54,0.9),vec3(1.0,0.46,0.25),fres)*fres*0.9;
      col+=vec3(0.9,0.97,1.0)*spec*0.95;
    }else{
      col=mix(vec3(0.16,0.09,0.1),vec3(0.98,0.36,0.32),diff*0.8+0.22);
      col+=vec3(1.0,0.76,0.52)*spec*0.4;
    }

    float fog=exp(-t*0.04);
    col=mix(sky,col,fog);
  }

  float storm=0.0;
  storm+=rain(uv*vec2(7.0,5.0),1.3,1.7);
  storm+=rain(uv*vec2(10.0,7.0)+vec2(2.0,0.0),4.7,2.3)*0.7;
  storm+=rain(uv*vec2(13.0,8.0)-vec2(1.5,0.0),8.1,2.8)*0.45;
  col=mix(col,col+vec3(0.28,0.62,0.96),storm*0.76);

  float vignette=smoothstep(1.65,0.28,length(uv));
  col*=vignette;
  col=pow(max(col,0.0),vec3(0.95));
  gl_FragColor=vec4(col,1.0);
}
`;

export const PINKTHOSITIVE_DASHBOARD_SHADERS = [
  {
    id: "prism_cathedral",
    title: "Prism Cathedral",
    category: "Cosmic Architecture",
    artifactType: "Hero Render",
    targetUse: "Title sequence / splash art / cinematic backdrop",
    exportPath: "Still, looping video, or reconstructed engine corridor",
    description:
      "A silver-and-cyan cathedral corridor with crystal spines, hard architectural rhythm, and glowing rails moving through the frame.",
    metaPrompt: [
      "Subject: impossible cathedral made of crystal and metal",
      "Artifact: hero render, not a reusable tiling texture",
      "Primary read: corridor silhouette, repeating arches, central crystal spine",
      "Avoid: generic sci-fi noise with no structure"
    ],
    shader: PRISM_CATHEDRAL
  },
  {
    id: "stellar_orchid",
    title: "Stellar Orchid",
    category: "Cosmic Bioform",
    artifactType: "Hero Render",
    targetUse: "Poster art / animated key visual / splash screen",
    exportPath: "Still, video loop, or bloom-heavy background plate",
    description:
      "A luminous flower-form suspended in nebula space, built from layered petals, glowing throat detail, and orbital pollen filaments.",
    metaPrompt: [
      "Subject: cosmic flower that reads from silhouette first",
      "Artifact: hero render for key art",
      "Primary read: petal crown, glowing center, starfield depth",
      "Avoid: flat kaleidoscope pattern"
    ],
    shader: STELLAR_ORCHID
  },
  {
    id: "obsidian_monsoon",
    title: "Obsidian Monsoon",
    category: "Storm Landscape",
    artifactType: "Hero Render",
    targetUse: "Environment concept / loading screen / trailer plate",
    exportPath: "Still, video loop, or rebuilt scene with monolith meshes",
    description:
      "A field of reflective black slabs under chromatic storm light, with rain streaks, aurora spill, and wet ground glare.",
    metaPrompt: [
      "Subject: monolith landscape under neon weather",
      "Artifact: hero render with readable environment composition",
      "Primary read: vertical slab forms, wet ground, storm atmosphere",
      "Avoid: abstract rain wallpaper"
    ],
    shader: OBSIDIAN_MONSOON
  }
];
