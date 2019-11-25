export default interface GL_State {
    ctx:WebGL2RenderingContext,
    program: WebGLProgram,
    uniforms:{[s: string]: WebGLUniformLocation},
};

function createShader(ctx:WebGLRenderingContext, source:string, type:number):WebGLShader {
    let shader = <WebGLShader>ctx.createShader(type);
    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);

    if(!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
        let error = ctx.getShaderInfoLog(shader);
        throw "Shader compile failed: "+ error;
    }
    return shader;
}

function createProgram(ctx:WebGLRenderingContext, vertexSource:string, fragmentSource:string):WebGLProgram {
    let vertexShader = createShader(ctx, vertexSource, ctx.VERTEX_SHADER);
    let fragmentShader = createShader(ctx, fragmentSource, ctx.FRAGMENT_SHADER);

    let program = <WebGLProgram>ctx.createProgram();
    ctx.attachShader(program, vertexShader);
    ctx.attachShader(program, fragmentShader);
    ctx.linkProgram(program);

    if(!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
        let error = ctx.getProgramInfoLog(program);
        throw "Program link failed: "+ error;
    }
    return program;
}

export function getUniformLocation(opengl:GL_State, uniform:string):WebGLUniformLocation {
    if(uniform in opengl.uniforms) {
        return opengl.uniforms[uniform];
    }
    let location =  <WebGLUniformLocation>opengl.ctx.getUniformLocation(opengl.program, uniform);
    opengl.uniforms[uniform] = location;
    return location;
}

export function NewState(vertexShader:string, fragmentShader:string):GL_State {
    const canvasElement = <HTMLCanvasElement>document.getElementById("canvas");
    const ctx = <WebGL2RenderingContext>canvasElement.getContext('webgl2');
    const program = createProgram(ctx, vertexShader, fragmentShader);
    ctx.useProgram(program);

    const bufferData = new Float32Array([
        -1, -1, -1, 1, 1, -1,

        1, -1, -1, 1, 1, 1,
    ]);
    const buffer = <WebGLBuffer>ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, bufferData, ctx.STATIC_DRAW);

    const vertexAttrib = ctx.getAttribLocation(program, 'position');
    ctx.enableVertexAttribArray(vertexAttrib);
    ctx.vertexAttribPointer(vertexAttrib, 2, ctx.FLOAT, false, 0, 0);

    return {
        ctx:ctx,
        program:program,
        uniforms:{},
    };
}