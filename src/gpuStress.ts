export class GPUStressTest {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null;
  private program: WebGLProgram | null = null;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) {
      console.error('WebGL not supported');
    }
  }

  private initWebGL(loopCount: number) {
    if (!this.gl) return;
    const gl = this.gl;

    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        
        // Slow rotation to make it dynamic
        float t = u_time * 0.1;
        mat2 rot = mat2(cos(t), -sin(t), sin(t), cos(t));
        p = rot * p;

        // 1. Beautiful Liquid Plasma (Visual Effect)
        // Scale visual iterations down if loopCount is very low to maintain high FPS
        float visualIters = ${loopCount} < 200 ? 4.0 : 8.0;
        vec2 uv = p * 1.5;
        float time = u_time * 0.4;
        for(float i = 1.0; i < 10.0; i++) {
            if (i >= visualIters) break;
            vec2 new_uv = uv;
            new_uv.x += 0.6 / i * cos(i * 2.5 * uv.y + time);
            new_uv.y += 0.6 / i * cos(i * 1.5 * uv.x + time);
            uv = new_uv;
        }
        // Normalize to [0, 1] range
        float visualIntensity = 0.5 * sin(uv.x + uv.y) + 0.5;

        // 2. Stress Loop (Performance Burner)
        // We do heavy trig math here to stress the GPU, and add a tiny bit of its 
        // result to the final color to prevent the compiler from optimizing it out.
        float stressAcc = 0.0;
        float stressAmp = 0.5 / float(${loopCount}); 
        
        for(int i = 0; i < ${loopCount}; i++) {
           float fi = float(i);
           vec2 q = p * (1.0 + mod(fi, 13.0) * 0.1); 
           stressAcc += sin(length(q) * 20.0 + u_time + fi * 0.11) * stressAmp;
           stressAcc += cos(q.x * q.y * 30.0 - u_time + fi * 0.13) * stressAmp;
        }

        // Combine visual plasma and stress grain
        float intensity = visualIntensity + stressAcc;

        // 3. Neon blue/purple/magenta color scheme
        vec3 darkBlue = vec3(0.02, 0.0, 0.15);
        vec3 purple = vec3(0.3, 0.0, 0.6);
        vec3 magenta = vec3(0.8, 0.1, 0.8);
        vec3 brightBlue = vec3(0.1, 0.4, 1.0);

        vec3 col = darkBlue;
        col = mix(col, purple, smoothstep(0.0, 0.3, intensity));
        col = mix(col, magenta, smoothstep(0.3, 0.7, intensity));
        col = mix(col, brightBlue, smoothstep(0.7, 1.0, intensity));
        
        // Bright core highlight
        col += vec3(1.0, 0.8, 1.0) * smoothstep(0.9, 1.2, intensity);
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource)!;
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource)!;

    this.program = gl.createProgram();
    if (!this.program) return;
    
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.program));
      return;
    }
  }

  private loadShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public start(loopCount: number = 3000) {
    if (!this.gl || this.isRunning) return;
    
    this.initWebGL(loopCount);
    if (!this.program) return;

    this.isRunning = true;
    this.canvas.classList.add('active');

    const gl = this.gl;
    gl.useProgram(this.program);

    const positionAttributeLocation = gl.getAttribLocation(this.program, "aVertexPosition");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    const positions = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(this.program, "u_resolution");
    const timeLocation = gl.getUniformLocation(this.program, "u_time");

    let startTime = performance.now();

    const render = (time: number) => {
      if (!this.isRunning) return;

      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(timeLocation, (time - startTime) * 0.001);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  public stop() {
    this.isRunning = false;
    this.canvas.classList.remove('active');
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.gl) {
      this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
  }
}
