const COMMON_GLSL = `
float hash(float n){return fract(sin(n)*43758.5453123);}
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
vec3 randDir(float seed){
  float z=hash(seed*1.17)*2.0-1.0;
  float a=hash(seed*2.31)*6.28318530718;
  float r=sqrt(max(0.0,1.0-z*z));
  return vec3(r*cos(a),z,r*sin(a));
}
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
`;

const MOON_COMMON = `
float craterFn(vec3 n,vec3 center,float radius,float depth){
  float d=1.0-dot(n,center);
  float x=d/max(radius*radius,0.00008);
  float r=sqrt(max(x,0.0));
  float interior=1.0-smoothstep(0.0,1.0,x);
  float bowl=-pow(interior,1.45)*depth;
  float rim=exp(-pow((r-1.0)/0.2,2.0))*depth*0.78;
  float ejecta=exp(-x*1.7)*depth*0.08;
  return bowl+rim+ejecta;
}

float mareMask(vec3 n){
  float m=0.0;
  for(int i=0;i<4;i++){
    float fi=float(i);
    vec3 center=randDir(uSeed*9.7+fi*7.31);
    float mareBasin=smoothstep(0.82,0.93,dot(n,center));
    m=max(m,mareBasin);
  }
  return m*uMare;
}

float moonHeight(vec3 n){
  vec3 p=n*3.5+uSeed*0.3;
  float h=fbm(p)*0.035;
  h+=fbm(n*11.0+uSeed*0.9)*0.01;
  h-=abs(snoise(n*7.5+uSeed*1.3))*0.008;
  h-=mareMask(n)*0.018;
  float cr=0.0;
  for(int i=0;i<16;i++){
    float fi=float(i);
    vec3 center=randDir(uSeed*13.0+fi*11.17);
    float radius=mix(0.05,0.13,hash(uSeed*31.0+fi*2.3));
    float depth=mix(0.015,0.05,hash(uSeed*41.0+fi*5.1));
    cr+=craterFn(n,center,radius,depth);
  }
  for(int i=0;i<34;i++){
    float fi=float(i);
    vec3 center=randDir(uSeed*71.0+fi*3.87);
    float radius=mix(0.012,0.05,hash(uSeed*83.0+fi*1.7));
    float depth=mix(0.003,0.013,hash(uSeed*97.0+fi*2.9));
    cr+=craterFn(n,center,radius,depth);
  }
  return h+cr*uCraterAmp;
}

vec3 moonShadeNormal(vec3 dir,float h0){
  vec3 t=normalize(abs(dir.y)<0.98?cross(dir,vec3(0.0,1.0,0.0)):cross(dir,vec3(1.0,0.0,0.0)));
  vec3 b=normalize(cross(dir,t));
  float e=0.006;
  float ht=moonHeight(normalize(dir+t*e));
  float hb=moonHeight(normalize(dir+b*e));
  return normalize(dir-(ht-h0)/e*t*1.4-(hb-h0)/e*b*1.4);
}
`;

export const MOON_MATERIAL_VERT = `
uniform float uSeed;
uniform float uMare;
uniform float uCold;
uniform float uCraterAmp;
uniform float uHeightScale;
varying vec3 vObjDir;
varying vec3 vWorldPos;
varying float vHeight;
${COMMON_GLSL}
${MOON_COMMON}

void main(){
  vec3 dir=normalize(position);
  float h=moonHeight(dir);
  vec3 displaced=dir*(1.0+h*uHeightScale);
  vObjDir=normalize(displaced);
  vHeight=h;
  vec4 world=modelMatrix*vec4(displaced,1.0);
  vWorldPos=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

export const MOON_MATERIAL_FRAG = `
uniform vec3 uLightDir;
uniform float uSeed;
uniform float uMare;
uniform float uCold;
uniform float uCraterAmp;
uniform float uHeightScale;
varying vec3 vObjDir;
varying vec3 vWorldPos;
varying float vHeight;
${COMMON_GLSL}
${MOON_COMMON}

void main(){
  vec3 dir=normalize(vObjDir);
  vec3 n=moonShadeNormal(dir,vHeight);
  vec3 lightDir=normalize(uLightDir);
  vec3 viewDir=normalize(cameraPosition-vWorldPos);
  float diff=max(dot(n,lightDir),0.0);
  float hemi=0.5+0.5*n.y;
  float spec=pow(max(dot(reflect(-lightDir,n),viewDir),0.0),24.0);
  float rim=pow(1.0-max(dot(n,viewDir),0.0),3.0);
  float mare=mareMask(dir);
  float dust=fbm(dir*30.0+uSeed*2.7)*0.5+0.5;
  float tone=clamp(vHeight*8.0+0.55,0.0,1.0);
  vec3 highland=mix(vec3(0.18,0.18,0.19),vec3(0.63,0.63,0.66),hemi*0.65+tone*0.35);
  vec3 basalt=mix(vec3(0.12,0.13,0.15),vec3(0.34,0.35,0.38),tone*0.6+0.2);
  vec3 albedo=mix(highland,basalt,mare*0.88);
  albedo*=mix(0.93,1.08,dust);
  vec3 col=albedo*(0.18+diff*0.95);
  col+=vec3(1.0,0.98,0.95)*spec*0.18;
  col+=mix(vec3(0.08,0.08,0.1),vec3(0.48,0.7,1.0),uCold)*rim*0.12;
  col*=1.0-clamp(-vHeight*12.0,0.0,1.0)*0.12;
  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.94)),1.0);
}
`;

export const TENTACLE_MATERIAL_VERT = `
uniform float uTime;
uniform float uSeed;
uniform float uSway;
uniform float uRadius;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
${COMMON_GLSL}

void main(){
  vUv=uv;
  vec3 pos=position;
  float along=uv.x;
  float thickness=mix(1.1,0.18,pow(along,1.18));
  float rootBulge=exp(-pow(along/0.18,2.0))*uRadius*0.38;
  pos-=normal*uRadius*(1.0-thickness);
  pos+=normal*rootBulge;
  float wave=sin(uTime*1.2+along*8.0+uSeed*4.3)*0.08*pow(along,1.4)*uSway;
  float wave2=cos(uTime*0.9+along*11.0+uSeed*6.1)*0.05*pow(along,1.25)*uSway;
  pos.x+=wave;
  pos.z+=wave2;
  pos+=normal*sin(along*24.0+uTime*5.0+uSeed*9.0)*0.012*(0.25+along*0.75);
  vec4 world=modelMatrix*vec4(pos,1.0);
  vWorldPos=world.xyz;
  vWorldNormal=normalize(normalMatrix*normal);
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

export const TENTACLE_MATERIAL_FRAG = `
uniform float uTime;
uniform float uSeed;
uniform vec3 uLightDir;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
${COMMON_GLSL}

float rowBand(float center,float width,float coord){
  float d=abs(fract(coord-center+0.5)-0.5);
  return smoothstep(width,0.0,d);
}

void main(){
  vec3 n=normalize(vWorldNormal);
  vec3 lightDir=normalize(uLightDir);
  vec3 viewDir=normalize(cameraPosition-vWorldPos);

  float underside=pow(max(cos((fract(vUv.y+0.22)-0.5)*6.28318530718),0.0),2.2);
  float underside2=pow(max(cos((fract(vUv.y+0.36)-0.5)*6.28318530718),0.0),3.2)*0.45;
  float band=max(underside,underside2);

  vec2 cupUv1=vec2(fract(vUv.x*11.0+uSeed*0.13)-0.5,(fract(vUv.y+0.22)-0.5)*3.8);
  vec2 cupUv2=vec2(fract(vUv.x*11.0+0.5+uSeed*0.19)-0.5,(fract(vUv.y+0.36)-0.5)*4.4);
  float cupR1=length(cupUv1);
  float cupR2=length(cupUv2);
  float cupRing1=exp(-pow((cupR1-0.22)/0.09,2.0))*underside;
  float cupCore1=exp(-pow(cupR1/0.12,2.0))*underside;
  float cupRing2=exp(-pow((cupR2-0.18)/0.08,2.0))*underside2;
  float cupCore2=exp(-pow(cupR2/0.09,2.0))*underside2;
  float cups=max(cupRing1,cupRing2);
  float cupCore=max(cupCore1,cupCore2);

  float veins=fbm(vec3(vUv.x*14.0,vUv.y*8.0,uSeed*2.0+uTime*0.08))*0.5+0.5;
  float slime=fbm(vec3(vUv.x*40.0,vUv.y*22.0,uSeed*3.0-uTime*0.12))*0.5+0.5;
  float bio=band*(0.5+0.5*sin(uTime*1.6+vUv.x*18.0+uSeed*7.0))*0.18;

  vec3 baseA=vec3(0.07,0.02,0.1);
  vec3 baseB=vec3(0.32,0.04,0.22);
  vec3 baseC=vec3(0.78,0.15,0.45);
  vec3 body=mix(baseA,baseB,pow(vUv.x,0.7));
  body=mix(body,baseC,band*0.35);
  body+=vec3(0.05,0.0,0.04)*(veins-0.5)*1.1;
  body*=mix(0.85,1.12,slime);

  vec3 cupCol=mix(vec3(0.72,0.46,0.66),vec3(1.0,0.76,0.86),cupCore);
  body=mix(body,cupCol,clamp(cups*0.8+cupCore*0.55,0.0,1.0));

  float diff=max(dot(n,lightDir),0.0);
  float spec=pow(max(dot(reflect(-lightDir,n),viewDir),0.0),26.0);
  float rim=pow(1.0-max(dot(n,viewDir),0.0),2.0);
  vec3 col=body*(0.16+diff*0.94);
  col+=vec3(0.98,0.98,1.0)*spec*0.34;
  col+=vec3(0.1,0.95,1.0)*(bio+rim*0.08);
  col+=vec3(0.05,0.18,0.22)*band*0.1;
  gl_FragColor=vec4(pow(max(col,0.0),vec3(0.95)),1.0);
}
`;
