const precision = 16;
const dataBits = 15;
const base = 1 << dataBits;
;
function getBigNum(value) {
    let result = {
        sign: value >= 0,
        data: new Uint32Array(precision),
    };
    value = Math.abs(value);
    for (let index = 0, count = 0; index < precision; count++, value *= 2) {
        if (count % dataBits == 0) {
            let dataInt = Math.floor(value);
            result.data[index++] = dataInt;
            value -= dataInt;
        }
    }
    return result;
}
function getFloat(num) {
    let result = 0;
    for (let index = precision - 1; index >= 0; index--) {
        result /= base;
        result += num.data[index];
    }
    return num.sign ? result : -result;
}
function absAGreater(a, b) {
    for (let index = 0; index < precision; index++) {
        if (a.data[index] != b.data[index]) {
            return a.data[index] > b.data[index];
        }
    }
    return true;
}
function subtract_fast(big, small, sign) {
    let bigClone = big.data.slice();
    let result = {
        sign: sign,
        data: new Uint32Array(precision),
    };
    for (let index = precision - 1; index >= 0; index--) {
        if (bigClone[index] >= small.data[index]) {
            result.data[index] = bigClone[index] - small.data[index];
            continue;
        }
        result.data[index] = base + bigClone[index] - small.data[index];
        for (let fetchIndex = index - 1; fetchIndex >= 0; fetchIndex--) {
            if (bigClone[fetchIndex] != 0) {
                bigClone[fetchIndex]--;
                break;
            }
            bigClone[fetchIndex] = base - 1;
        }
    }
    return result;
}
function add(a, b) {
    return addIgnoreSign(a, b, a.sign, b.sign);
}
function subtract(a, b) {
    return addIgnoreSign(a, b, a.sign, !b.sign);
}
function addIgnoreSign(a, b, aSign, bSign) {
    if (aSign != bSign) {
        if (absAGreater(a, b)) {
            return subtract_fast(a, b, aSign);
        }
        return subtract_fast(b, a, bSign);
    }
    let result = {
        sign: aSign,
        data: new Uint32Array(precision),
    };
    for (let index = precision - 1, carry = 0; index >= 0; index--) {
        let digit = a.data[index] + b.data[index] + carry;
        carry = Math.floor(digit / base);
        result.data[index] = digit % base;
    }
    return result;
}
function multiply(a, b) {
    let bigDataArray = new Uint32Array(precision * 2);
    for (let bottom = precision - 1; bottom >= 0; bottom--) {
        let carry = 0;
        for (let top = precision - 1; top >= 0; top--) {
            let index = top + bottom;
            if (index < 0)
                continue;
            let digit = a.data[top] * b.data[bottom] + carry + bigDataArray[index];
            carry = Math.floor(digit / base);
            bigDataArray[index] = digit % base;
        }
        for (let index = bottom - 1; index >= 0 && carry != 0; index--) {
            let digit = carry + bigDataArray[index];
            carry = Math.floor(digit / base);
            bigDataArray[index] = carry % base;
        }
    }
    return {
        sign: a.sign == b.sign,
        data: bigDataArray.slice(0, precision),
    };
}
export { getBigNum, getFloat, subtract, add, addIgnoreSign, multiply };
//# sourceMappingURL=bigNum.js.map