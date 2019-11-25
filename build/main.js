import { getBigNum, multiply, add, subtract, getFloat } from "./math/bigNum.js";
import { getUniformLocation } from "./webgl/webgl.js";
import floatDraw, { newGraphicState as floatState } from "./fractals/fractalFloat.js";
import bigNumDraw, { newGraphicState as bigState } from "./fractals/fractalDecimal.js";
;
var Backend;
(function (Backend) {
    Backend[Backend["FLOAT"] = 0] = "FLOAT";
    Backend[Backend["BIG_NUM"] = 1] = "BIG_NUM";
})(Backend || (Backend = {}));
;
const backendFunctions = {
    NewState: [
        floatState,
        bigState,
    ],
    Draw: [
        floatDraw,
        bigNumDraw,
    ],
};
let state;
function changeSettings() {
    const precisionSelection = document.getElementById("precision");
    const iterationsInput = document.getElementById("iterations");
    const thresholdInput = document.getElementById("threshold");
    const precision = precisionSelection.value;
    if (precision == "float") {
        if (state.backend != Backend.FLOAT) {
            alert("Recompiling shaders... This could take some time");
            state.backend = Backend.FLOAT;
            state.opengl = backendFunctions.NewState[Backend.FLOAT](0);
        }
    }
    else {
        let precision = parseInt(precisionSelection.value);
        if (state.backend != Backend.BIG_NUM || state.precision != precision) {
            state.backend = Backend.BIG_NUM;
            state.precision = precision;
            state.opengl = backendFunctions.NewState[Backend.BIG_NUM](precision);
        }
    }
    state.itterations = parseFloat(iterationsInput.value);
    state.threshold = parseFloat(thresholdInput.value);
    state.screenInvalid = true;
}
function onAnimationFrame() {
    let { ctx } = state.opengl;
    ctx.uniform1ui(getUniformLocation(state.opengl, "itter"), state.itterations);
    ctx.uniform1ui(getUniformLocation(state.opengl, "farSquared"), state.threshold * state.threshold);
    backendFunctions.Draw[state.backend](state.opengl, state.corners, 6);
}
function scrollWheel(e) {
    state.screenInvalid = true;
    let direction = e.deltaY > 0 ? -1 : 1;
    let canvas = e.srcElement;
    let { width, height, bottom, left } = state.corners;
    let speed = getBigNum(0.1 * direction);
    if (!speed.sign && getFloat(width) > 4) {
        let centerX = getBigNum(-2.5);
        let centerY = getBigNum(-2);
        speed.sign = true;
        state.corners.left = add(left, multiply(subtract(centerX, left), speed));
        state.corners.bottom = add(bottom, multiply(subtract(centerY, bottom), speed));
        return;
    }
    let centerX = add(multiply(getBigNum(e.offsetX / canvas.width), width), left);
    let centerY = add(multiply(getBigNum(1 - (e.offsetY / canvas.height)), height), bottom);
    state.corners.bottom = add(bottom, multiply(subtract(centerY, bottom), speed));
    state.corners.height = subtract(add(add(bottom, height), multiply(subtract(centerY, add(bottom, height)), speed)), state.corners.bottom);
    state.corners.left = add(left, multiply(subtract(centerX, left), speed));
    state.corners.width = subtract(add(add(left, width), multiply(subtract(centerX, add(left, width)), speed)), state.corners.left);
}
window.onload = () => {
    const canvasElement = document.getElementById("canvas");
    canvasElement.height = canvasElement.offsetHeight;
    canvasElement.width = canvasElement.offsetWidth;
    state = {
        screenInvalid: true,
        corners: {
            width: getBigNum(4),
            height: getBigNum(4),
            bottom: getBigNum(-2),
            left: getBigNum(-2.5),
        },
        precision: 4,
        itterations: 100,
        threshold: 10,
        opengl: backendFunctions.NewState[Backend.FLOAT](0),
        backend: Backend.FLOAT,
    };
    document.getElementById("applyBtn").onclick = changeSettings;
    canvasElement.onwheel = scrollWheel;
    requestAnimationFrame(onAnimationFrame);
};
//# sourceMappingURL=main.js.map