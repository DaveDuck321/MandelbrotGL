import { getUniformLocation, NewState } from "../webgl/webgl.js";
const vertexShader = `#version 300 es
in vec2 position;

out vec2 coord;
void main() {
    coord = position * 0.5 + vec2(0.5, 0.5);
    gl_Position = vec4(position, 0.0, 1.0);
}`;
const fragmentShader = `#version 300 es
precision mediump float;
const uint size = %PRECISION%u;

const uint dataBits = 15u;
const uint base = 1u<<dataBits;

uniform uint itter;
uniform uint farSquared;

in vec2 coord;
out vec4 color;

struct Number {
    bool sign;
    uint data[size];
};

uniform Number Left, Bottom, Width, Height;

//Cached vars
Number tempNum;
uint multFullData[size*2u];

bool absABigger(in Number a, in Number b) {
    for(uint index=0u; index < size; index++) {
        if(a.data[index] != b.data[index]) {
            return a.data[index] > b.data[index];
        }
    }
    return true;
}

//Big take small. Signs are ignored
Number subtract(in Number big, in Number small, in bool sign) {
    tempNum.sign = sign;

    for(uint i = 0u; i < size; i++) {
        uint index = size-1u - i;

        if(big.data[index] >= small.data[index]) {
            tempNum.data[index] = big.data[index] - small.data[index];
        } else {
            tempNum.data[index] = base + big.data[index] - small.data[index];
            for(int fetchIndex = int(index-1u); fetchIndex >= 0; fetchIndex--) {
                if(big.data[fetchIndex] != 0u) {
                    big.data[fetchIndex]--;
                    break;
                }
                big.data[fetchIndex] = base - 1u;
            }
        }
    }
    return tempNum;
}

Number add(in Number a, in Number b) {
    if(a.sign != b.sign) {
        if(absABigger(a, b)) {
            return subtract(a, b, a.sign);
        }
        return subtract(b, a, b.sign);
    }
    tempNum.sign = a.sign;

    for(uint i = 0u, carry = 0u; i < size; i++) {
        uint index = size-1u - i;

        uint result = a.data[index] + b.data[index] + carry;
        carry = result/base;

        tempNum.data[index] = result%base;
    }
    return tempNum;
}

Number addIgnoreSign(in Number a, in Number b, in bool aSign, in bool bSign) {
    if(aSign != bSign) {
        if(absABigger(a, b)) {
            return subtract(a, b, aSign);
        }
        return subtract(b, a, bSign);
    }
    tempNum.sign = aSign;

    for(uint i = 0u, carry = 0u; i < size; i++) {
        uint index = size-1u - i;

        uint result = a.data[index] + b.data[index] + carry;
        carry = result/base;

        tempNum.data[index] = result%base;
    }
    return tempNum;
}

Number multiply(in Number a, in Number b) {
    tempNum.sign = a.sign == b.sign;

    for(uint index = 0u; index < size*2u; index++) {
        multFullData[index] = 0u;
    }
    
    for(int bottom = int(size-1u); bottom >= 0; bottom--) {
        uint carry = 0u;

        for(int top = int(size-1u); top >= 0; top--) {
            int index = top + bottom;
            if(index >= 0) {
                uint result = a.data[top] * b.data[bottom] + carry + multFullData[index];
                carry = result/base;
                multFullData[index] = result%base;
            }
        }
        for(int index = bottom-1; index >=0 && carry != 0u; index--) {
            uint result = carry + multFullData[index];
            carry = result/base;
            multFullData[index] = result%base;
        }
    }
    for(uint index=0u; index < size; index++) {
        tempNum.data[index] = multFullData[index];
    }
    return tempNum;
}

Number multiplyFast(in Number a, in Number b) {
    tempNum.sign = a.sign == b.sign;

    for(uint index = 0u; index < size; index++) {
        tempNum.data[index] = 0u;
    }
    
    for(int bottom = int(size-1u); bottom >= 0; bottom--) {
        uint carry = 0u;

        for(int top = int(size-1u); top >= 0; top--) {
            int index = top + bottom;
            if(index >= 0 && uint(index) < size) {
                uint result = a.data[top] * b.data[bottom] + carry + tempNum.data[index];
                carry = result/base;
                tempNum.data[index] = result%base;
            }
        }
        for(int index = bottom-1; index >=0 && carry != 0u; index--) {
            uint result = carry + tempNum.data[index];
            carry = result/base;
            tempNum.data[index] = result%base;
        }
    }
    return tempNum;
}

Number doubleNum(in Number a) {
    tempNum.sign = a.sign;

    for(uint i = 0u, carry = 0u; i < size; i++) {
        uint index = size-1u - i;

        uint result = 2u*a.data[index] + carry;
        carry = result/base;

        tempNum.data[index] = result%base;
    }
    return tempNum;
}

uint stepsToInfinity(Number cReal, Number cImag) {
    Number zReal = cReal;
    Number zImag = cImag;

    for(uint i=0u; i<itter; i++) {
        //Number product = multiply(zReal, zImag);
        Number product = multiplyFast(zReal, zImag);

        //zReal = add(addIgnoreSign(multiply(zReal, zReal), multiply(zImag, zImag), true, false), cReal);
        //zImag = add(add(product, product), cImag);

        zReal = add(addIgnoreSign(multiplyFast(zReal, zReal), multiplyFast(zImag, zImag), true, false), cReal);
        zImag = add(doubleNum(product), cImag);

        if(zReal.data[0]*zReal.data[0] + zImag.data[0]*zImag.data[0] > farSquared) {
            return i;
        }
    }
    return 0u;
}

Number getNum(float data) {
    tempNum.sign = data > 0.0f;
    if(!tempNum.sign) {
        data *= -1.0;
    }

    for(uint index = 0u, count = 0u; index < size; count++, data*=2.0) {
        if(count % dataBits == 0u) {
            uint dataInt = uint(data);
            tempNum.data[index++] = dataInt;
            data -= float(dataInt);
        }
    }
    return tempNum;
}

void main() {
    Number cReal = add(multiply(getNum(coord.x), Width), Left);
    Number cImag = add(multiply(getNum(coord.y), Height), Bottom);

    float brightness = float(stepsToInfinity(cReal, cImag)) / float(itter);
    color = vec4(brightness, brightness, brightness, 1.0);
}`;
export default function drawFrame(opengl, corners, precision) {
    let { ctx } = opengl;
    let { width, height, bottom, left } = corners;
    ctx.uniform1uiv(getUniformLocation(opengl, "Left.data"), left.data.slice(0, precision));
    ctx.uniform1i(getUniformLocation(opengl, "Left.sign"), +left.sign);
    ctx.uniform1uiv(getUniformLocation(opengl, "Bottom.data"), bottom.data.slice(0, precision));
    ctx.uniform1i(getUniformLocation(opengl, "Bottom.sign"), +bottom.sign);
    ctx.uniform1uiv(getUniformLocation(opengl, "Width.data"), width.data.slice(0, precision));
    ctx.uniform1i(getUniformLocation(opengl, "Width.sign"), 1);
    ctx.uniform1uiv(getUniformLocation(opengl, "Height.data"), height.data.slice(0, precision));
    ctx.uniform1i(getUniformLocation(opengl, "Height.sign"), 1);
    ctx.drawArrays(ctx.TRIANGLES, 0, 6);
}
export function newGraphicState(precision) {
    return NewState(vertexShader, fragmentShader.replace("%PRECISION%", precision + ""));
}
//# sourceMappingURL=fractalDecimal.js.map