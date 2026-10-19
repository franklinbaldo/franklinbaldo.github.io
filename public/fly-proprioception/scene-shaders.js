/* Original implementation. Visual technique reference, read-only:
 * https://github.com/gokayfem/shader-skills/blob/main/skills/shader-art-coding/templates/raymarch-sdf.glsl
 * Studio lighting, explicit material IDs and SDF inspection inspired this scene.
 * No source from that MIT-licensed repository is copied or executed here.
 * Geometry is schematic, not an anatomical reconstruction or force model.
 */
export const vertexSource = `#version 300 es
precision highp float;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const fragmentSource = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uResolution;
uniform float uAngle;
uniform float uCurvature;
uniform float uRoughness;
uniform float uLight;
uniform float uDetail;
uniform float uArtistic;
uniform float uActivity;
uniform float uConnected;
uniform vec3 uPalette;
const vec3 HIP = vec3(-1.25, 1.65, 0.0);
const vec3 KNEE = vec3(0.0, 1.65, 0.0);
vec3 tip() { return KNEE + vec3(-cos(uAngle), -sin(uAngle), 0.0) * 1.36; }
// The shell radius changes, never the segment axis, included angle or endpoints.
float shell(vec3 p, vec3 a, vec3 b, float radius) {
  vec3 ab = b-a;
  float t = clamp(dot(p-a, ab)/dot(ab,ab), 0.0, 1.0);
  float bulge = sin(t * 3.14159265);
  float r = radius * (0.68 + (0.30 + 0.55*uCurvature)*bulge*bulge);
  // Conservative marching factor accounts for the varying radius.
  return (length(p-a-ab*t)-r)*0.72;
}
float capsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 ab=b-a;
  return length(p-a-ab*clamp(dot(p-a,ab)/dot(ab,ab),0.0,1.0))-r;
}
vec2 scene(vec3 p) {
  vec2 hit=vec2(shell(p,HIP,KNEE,0.155),1.0);
  float d=shell(p,KNEE,tip(),0.095);
  if(d<hit.x) hit=vec2(d,2.0);
  vec3 q=p-KNEE;
  d=length(vec2(length(q.xy)-0.165,q.z))-0.044;
  if(d<hit.x) hit=vec2(d,3.0);
  d=length(p-HIP)-0.125;
  if(d<hit.x) hit=vec2(d,3.0);
  // Separate neural-data marker; geometry and palette never encode activity.
  d=length(p-(HIP+vec3(0.0,0.0,0.16)))-0.056;
  if(d<hit.x) hit=vec2(d,4.0);
  if(uArtistic<0.5) {
    vec3 offset=vec3(0.0,0.0,0.24);
    d=min(capsule(p,HIP+offset,KNEE+offset,0.009),capsule(p,KNEE+offset,tip()+offset,0.009));
    if(d<hit.x) hit=vec2(d,5.0);
  }
  return hit;
}
vec3 normalAt(vec3 p) {
  vec2 e=vec2(0.0015,0.0);
  return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,
    scene(p+e.yxy).x-scene(p-e.yxy).x,
    scene(p+e.yyx).x-scene(p-e.yyx).x));
}
void main() {
  vec2 uv=(2.0*gl_FragCoord.xy-uResolution)/uResolution.y;
  vec3 eye=vec3(0.25,2.65,5.3);
  vec3 target=vec3(-0.1,1.02,0.0);
  vec3 forward=normalize(target-eye);
  vec3 right=normalize(cross(forward,vec3(0.0,1.0,0.0)));
  vec3 up=cross(right,forward);
  vec3 ray=normalize(forward*3.15+uv.x*right+uv.y*up);
  vec3 bg=mix(vec3(0.020,0.035,0.055),vec3(0.075,0.105,0.125),clamp(0.5+uv.y*0.25,0.0,1.0));
  float floorT=ray.y < -0.0001 ? (-0.08-eye.y)/ray.y : 100.0;
  vec3 floorPoint=eye+ray*floorT;
  vec3 col=bg;
  if(floorT<25.0) {
    float radial=length(floorPoint.xz-vec2(-0.15,0.0));
    float spacing=abs(fract(radial*2.0+0.5)-0.5);
    float width=max(fwidth(radial)*2.0,0.006);
    float rings=1.0-smoothstep(0.008,0.008+width,spacing);
    float pool=exp(-0.32*radial*radial);
    col=mix(bg,vec3(0.075,0.105,0.13)+pool*vec3(0.018,0.025,0.028)+rings*0.014,exp(-floorT*0.035));
    // Decorative grounding vignette, not a simulated contact/force field.
    float shadow=exp(-pow(floorPoint.x+0.25,2.0)*0.65-pow(floorPoint.z,2.0)*3.5);
    col*=1.0-shadow*0.32;
  }
  float t=0.2;
  vec2 hit=vec2(1.0,0.0);
  bool found=false;
  for(int i=0;i<64;i++) {
    if(t>min(floorT,10.0)) break;
    hit=scene(eye+ray*t);
    if(hit.x<0.0015) {found=true;break;}
    t+=max(hit.x,0.0008);
  }
  if(found) {
    vec3 p=eye+ray*t;
    vec3 n=normalAt(p);
    vec3 light=normalize(vec3(cos(uLight),1.35,sin(uLight)));
    vec3 view=-ray;
    vec3 base=mix(vec3(0.48,0.62,0.63),uPalette,mix(0.30,0.88,uArtistic));
    if(hit.y>1.5 && hit.y<2.5) base=mix(base,vec3(0.78,0.65,0.43),0.22);
    float longitudinal=hit.y<1.5 ? (p.x-HIP.x)/1.25 : dot(p-KNEE,normalize(tip()-KNEE));
    float ribs=0.5+0.5*cos(longitudinal*90.0);
    base*=1.0-uDetail*0.13*ribs;
    if(hit.y>2.5 && hit.y<3.5) base=vec3(0.52,0.36,0.15);
    if(hit.y>4.5) base=vec3(0.035,0.055,0.07);
    float diffuse=max(dot(n,light),0.0);
    float gloss=pow(max(dot(n,normalize(light+view)),0.0),mix(110.0,9.0,uRoughness));
    float fresnel=pow(1.0-max(dot(n,view),0.0),3.0);
    col=base*(0.23+0.78*diffuse+0.13*max(n.y,0.0));
    col+=vec3(1.0,0.88,0.68)*gloss*(0.48-0.28*uRoughness);
    col+=vec3(0.14,0.32,0.39)*fresnel;
    if(hit.y>3.5 && hit.y<4.5) {
      col=uConnected<0.5 ? vec3(0.12,0.15,0.17) : mix(vec3(0.19,0.075,0.016),vec3(1.4,0.62,0.08),uActivity);
      col+=gloss*0.12;
    }
  }
  col*=1.0-0.12*dot(uv,uv)/(1.0+dot(uv,uv));
  col=col/(col+vec3(1.0));
  outColor=vec4(pow(max(col,vec3(0.0)),vec3(1.0/2.2)),1.0);
}`;
