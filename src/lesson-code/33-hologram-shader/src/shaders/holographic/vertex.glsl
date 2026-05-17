uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

#include ../includes/random2D.glsl

void main()
{
    // 位置
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // 故障效果
    float glitchTime = uTime - modelPosition.y;
    float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) +  sin(glitchTime * 8.76);
    glitchStrength /= 3.0;
    glitchStrength = smoothstep(0.3, 1.0, glitchStrength);
    glitchStrength *= 0.25;
    modelPosition.x += (random2D(modelPosition.xz + uTime) - 0.5) * glitchStrength;
    modelPosition.z += (random2D(modelPosition.zx + uTime) - 0.5) * glitchStrength;

    // 最终位置
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // 模型法线
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // varying 变量
    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
}