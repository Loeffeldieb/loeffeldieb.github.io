const _vs = 
`
varying vec2 v_uv;

void main() {
    v_uv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _fs = 
`
#include <common>
varying vec2 v_uv;

uniform vec3 iResolution;
uniform float iTime;

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define MIN_DIST 0.01

float sdSphere(vec3 p, vec3 sp, float radius){
    p -= sp;
    return length(p) - radius;
}

float plane(vec3 p, float pp){
    float plane = p.y - pp;
    return plane;
}

float drawScene(vec3 p){
    float distanceToScene = 0.0;
    float sphere = sdSphere(p, vec3(0.0,0.0,0.0), 1.0);
    float plane = plane(p, -0.25);
    distanceToScene = min(sphere, plane);
    return distanceToScene;
}

float raymarch(vec3 ro, vec3 rd){
    float dist = 0.0;
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p = ro + rd * dist;
        float distanceFromPoint = drawScene(p);
        dist += distanceFromPoint;
        if(dist<MIN_DIST || distanceFromPoint>MAX_DIST)break;
    };
    return dist;
}

vec3 calcNormal(vec3 p){
    vec2 e = vec2(0.001, 0.0);
    float x = drawScene(p+e.xyy)-drawScene(p-e.xyy);
    float y = drawScene(p+e.yxy)-drawScene(p-e.yxy);
    float z = drawScene(p+e.yyx)-drawScene(p-e.yyx);
    vec3 n = vec3(x,y,z);
    return normalize(n);
}


float diffuseLight(vec3 p, vec3 lightPos){
    vec3 lightDir = normalize(p - lightPos);
    float diff = dot(calcNormal(p), -lightDir);
    diff = clamp(0.0,1.0,diff);
    return diff;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //Normalize
    vec2 uv = fragCoord / iResolution.xy - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    
    //Variables
    vec3 color = vec3(1.0);
    vec3 ro = vec3(0.0,1.0,-5.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    
    //Raymarch
    float d = raymarch(ro, rd);
    vec3 p = ro + rd * d;
    
    vec3 lightPos = vec3(2.0*sin(iTime),5.0,2.0*cos(iTime));
    color *= diffuseLight(p, lightPos);
    
    
    //Output
    fragColor = vec4(color, 1.0);
}
 
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}

`;

export {
    _vs, 
    _fs
};
