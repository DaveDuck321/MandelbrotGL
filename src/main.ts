import BigNum, { getBigNum, multiply, add,subtract, getFloat } from "./math/bigNum.js";
import GL_State, {getUniformLocation} from "./webgl/webgl.js"

import floatDraw, {newGraphicState as floatState} from "./fractals/fractalFloat.js"
import bigNumDraw, {newGraphicState as bigState} from "./fractals/fractalDecimal.js"

export interface Viewport {
    width:BigNum,
    height:BigNum,
    bottom:BigNum,
    left:BigNum,
};

enum Backend {
    FLOAT,
    BIG_NUM,
};

const backendFunctions = {
    NewState: [
        floatState,
        bigState,
    ] as ((precision:number)=>GL_State)[],
    Draw: [
        floatDraw,
        bigNumDraw,
    ] as ((arg0: GL_State, arg1: Viewport, precision:number)=>void)[],
};

let state:{
    drawQueued: boolean,

    precision: number,
    itterations: number,
    threshold: number,

    corners: Viewport,
    opengl:GL_State,
    backend:Backend,
};

function drawFrameOnce() {
    if(state.drawQueued) return;
    state.drawQueued = true;
    requestAnimationFrame(()=>{
        onAnimationFrame();
        state.drawQueued = false;
    });
}

function changeSettings() {
    const precisionSelection = <HTMLSelectElement>document.getElementById("precision");
    const iterationsInput = <HTMLInputElement>document.getElementById("iterations");
    const thresholdInput = <HTMLInputElement>document.getElementById("threshold");
    const precision = precisionSelection.value;
    if(precision=="float") {
        if(state.backend != Backend.FLOAT) {
            alert("Recompiling shaders... This could take some time");
            state.backend = Backend.FLOAT;
            state.opengl = backendFunctions.NewState[Backend.FLOAT](0);
        }
    } else {
        let precision = parseInt(precisionSelection.value);
        if(state.backend != Backend.BIG_NUM || state.precision != precision) {
            state.backend = Backend.BIG_NUM;
            state.precision = precision;
            state.opengl = backendFunctions.NewState[Backend.BIG_NUM](precision);
        }
    }
    state.itterations = parseFloat(iterationsInput.value);
    state.threshold = parseFloat(thresholdInput.value);
    drawFrameOnce();
}

function onAnimationFrame() {
    let {ctx} = state.opengl;
    ctx.uniform1ui(getUniformLocation(state.opengl, "itter"), state.itterations);
    ctx.uniform1ui(getUniformLocation(state.opengl, "farSquared"), state.threshold * state.threshold);

    backendFunctions.Draw[state.backend](state.opengl, state.corners, 6);
}

function scrollWheel(e:WheelEvent) {
    let direction = e.deltaY > 0 ? -1:1;
    let canvas = <HTMLCanvasElement>e.srcElement;

    let {width, height, bottom, left} = state.corners;
    let speed = getBigNum(0.1 * direction);
    if(!speed.sign && getFloat(width) > 4) {
        let centerX = getBigNum(-2.5);
        let centerY = getBigNum(-2);
        speed.sign = true;

        state.corners.left = add(left, multiply(subtract(centerX, left), speed));
        state.corners.bottom = add(bottom, multiply(subtract(centerY, bottom), speed));
        return;
    }

    let centerX = add(multiply(getBigNum(e.offsetX/canvas.width), width), left);
    let centerY = add(multiply(getBigNum(1-(e.offsetY/canvas.height)), height), bottom);

    state.corners.bottom = add(bottom, multiply(subtract(centerY, bottom), speed));
    state.corners.height = subtract(add(add(bottom, height), multiply(subtract(centerY, add(bottom, height)), speed)), state.corners.bottom);

    state.corners.left = add(left, multiply(subtract(centerX, left), speed));
    state.corners.width = subtract(add(add(left, width), multiply(subtract(centerX, add(left, width)), speed)), state.corners.left);

    drawFrameOnce();
}

window.onload = ()=>{
    const canvasElement = <HTMLCanvasElement>document.getElementById("canvas");
    canvasElement.height = canvasElement.offsetHeight;
    canvasElement.width = canvasElement.offsetWidth;

    const center = [-0.75, 0];
    const aspect = canvasElement.width/canvasElement.height;

    state = {
        drawQueued:false,
        corners: {
            width: getBigNum(4),
            height: getBigNum(4*aspect),
            bottom: getBigNum(-4*aspect*0.5 + center[1]),
            left: getBigNum(-4*0.5 + center[0]),
        },
        precision: 4,
        itterations: 100,
        threshold: 10,
        opengl:backendFunctions.NewState[Backend.FLOAT](0),
        backend: Backend.FLOAT,
    };

    (<HTMLElement>document.getElementById("applyBtn")).onclick = changeSettings;
    canvasElement.onwheel = scrollWheel;
    drawFrameOnce();
};