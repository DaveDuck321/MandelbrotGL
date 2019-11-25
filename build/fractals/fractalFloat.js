import { NewState, getUniformLocation } from "../webgl/webgl.js";
import { getFloat } from "../math/bigNum.js";
const vertexShader = `#version 300 es
in vec2 position;

out vec2 coord;
void main() {
    coord = position * 0.5 + vec2(0.5, 0.5);
    gl_Position = vec4(position, 0.0, 1.0);
}`;
const fragmentShader = `#version 300 es
precision mediump float;

uniform uint itter;
uniform uint farSquared;

uniform vec2 bottomCorner;
uniform vec2 dimensions;

in vec2 coord;
out vec4 color;

uint stepsToInfinity(vec2 c) {
    vec2 z = c;

    for(uint i=0u; i<itter; i++) {
        float real = (z.x * z.x - z.y * z.y)    + c.x;
        float imag = (2.0 * z.y * z.x)          + c.y;
        z = vec2(real, imag);

        if(real*real + imag*imag > float(farSquared)) {
            return i;
        }
    }
    return 0u;
}

void main() {
    vec2 c = vec2(coord.x * dimensions.x + bottomCorner.x, coord.y * dimensions.y + bottomCorner.y);

    float brightness = float(stepsToInfinity(c)) / 85.0;
    color = vec4(brightness, brightness, brightness, 1.0);
}`;
export default function drawFrame(opengl, corners, precision) {
    let { ctx } = opengl;
    let { width, height, bottom, left } = corners;
    ctx.uniform2f(getUniformLocation(opengl, "bottomCorner"), getFloat(left), getFloat(bottom));
    ctx.uniform2f(getUniformLocation(opengl, "dimensions"), getFloat(width), getFloat(height));
    ctx.drawArrays(ctx.TRIANGLES, 0, 6);
}
export function newGraphicState(precision) {
    return NewState(vertexShader, fragmentShader);
}
//# sourceMappingURL=fractalFloat.js.map