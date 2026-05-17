varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    // 位置
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // 模型法线
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // varying 变量
    vNormal = modelNormal.xyz;
    vPosition = modelPosition.xyz;
}