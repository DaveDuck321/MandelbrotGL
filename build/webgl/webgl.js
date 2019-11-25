;
function createShader(ctx, source, type) {
    let shader = ctx.createShader(type);
    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);
    if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
        let error = ctx.getShaderInfoLog(shader);
        throw "Shader compile failed: " + error;
    }
    return shader;
}
function createProgram(ctx, vertexSource, fragmentSource) {
    let vertexShader = createShader(ctx, vertexSource, ctx.VERTEX_SHADER);
    let fragmentShader = createShader(ctx, fragmentSource, ctx.FRAGMENT_SHADER);
    let program = ctx.createProgram();
    ctx.attachShader(program, vertexShader);
    ctx.attachShader(program, fragmentShader);
    ctx.linkProgram(program);
    if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
        let error = ctx.getProgramInfoLog(program);
        throw "Program link failed: " + error;
    }
    return program;
}
export function getUniformLocation(opengl, uniform) {
    if (uniform in opengl.uniforms) {
        return opengl.uniforms[uniform];
    }
    let location = opengl.ctx.getUniformLocation(opengl.program, uniform);
    opengl.uniforms[uniform] = location;
    return location;
}
export function NewState(vertexShader, fragmentShader) {
    const canvasElement = document.getElementById("canvas");
    const ctx = canvasElement.getContext('webgl2');
    const program = createProgram(ctx, vertexShader, fragmentShader);
    ctx.useProgram(program);
    const bufferData = new Float32Array([
        -1, -1, -1, 1, 1, -1,
        1, -1, -1, 1, 1, 1,
    ]);
    const buffer = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, bufferData, ctx.STATIC_DRAW);
    const vertexAttrib = ctx.getAttribLocation(program, 'position');
    ctx.enableVertexAttribArray(vertexAttrib);
    ctx.vertexAttribPointer(vertexAttrib, 2, ctx.FLOAT, false, 0, 0);
    return {
        ctx: ctx,
        program: program,
        uniforms: {},
    };
}
//# sourceMappingURL=webgl.js.map