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

vec3 palette(float t)
{
    vec3 a = vec3(0.698,0.500, 0.898);
    vec3 b = vec3(-0.542, 0.500, 0.248);
    vec3 c = vec3(-0.722, 1.000, 1.000);
    vec3 d = vec3(0.000, 0.333, 0.938);
    return a + b*cos( 6.28318*(c*t+d) );
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //Normalize
    vec2 uv = fragCoord / iResolution.xy * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    uv = v_uv;
     
    //Variablen
    vec3 color = vec3(1.0);
    
    vec3 finalColor = vec3(0.0);
    vec2 uv0 = v_uv - 0.5;
    
    for(float i = 0.0; i<2.0; i++){
        uv = fract(uv*2.0) - 0.5;

        float d = length(uv) - 0.9;
        color = palette(length(uv0) +iTime);


        d = sin(d*8.+ iTime*3.0) / 8.;
        d = abs(d);
        d = 0.02 / d;

        finalColor += color * d;
    };
    
    //output
    fragColor = vec4(finalColor, 1.0);
}
 
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}

`;

const _line_vs =
`
varying vec3 vPos;

void main() 
{
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _line_fs =
`
uniform vec3 origin;
uniform vec3 color;
uniform float time;
varying vec3 vPos;
float limitDistance = 0.5;

void main() {
    float distance = clamp(length(vPos - origin), 0., limitDistance);
    float opacity = 1. - distance / limitDistance;
    gl_FragColor = vec4(color, opacity);
}

`;

export {
    _vs, 
    _fs, 
    _line_vs,
    _line_fs
};
