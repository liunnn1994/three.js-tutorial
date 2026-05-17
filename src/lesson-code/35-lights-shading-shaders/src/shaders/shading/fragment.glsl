uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/ambientLight.glsl
#include ../includes/directionalLight.glsl
#include ../includes/pointLight.glsl

void main()
{
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 color = uColor;

    // 灯光
    vec3 light = vec3(0.0);

    light += ambientLight(
        vec3(1.0), // 灯光颜色
        0.03       // 灯光强度
    );

    light += directionalLight(
        vec3(0.1, 0.1, 1.0), // 灯光颜色
        1.0,                 // 灯光强度,
        normal,              // 法线
        vec3(0.0, 0.0, 3.0), // 灯光位置
        viewDirection,       // 视线方向
        20.0                 // 高光指数
    );

    light += pointLight(
        vec3(1.0, 0.1, 0.1), // 灯光颜色
        1.0,                 // 灯光强度,
        normal,              // 法线
        vec3(0.0, 2.5, 0.0), // 灯光位置
        viewDirection,       // 视线方向
        20.0,                // 高光指数
        vPosition,           // 位置
        0.25                 // 灯光衰减
    );

    light += pointLight(
        vec3(0.1, 1.0, 0.5), // 灯光颜色
        1.0,                 // 灯光强度,
        normal,              // 法线
        vec3(2.0, 0.0, 2.0), // 灯光位置
        viewDirection,       // 视线方向
        20.0,                // 高光指数
        vPosition,           // 位置
        0.2                  // 灯光衰减
    );

    color *= light;

    // 最终颜色
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}