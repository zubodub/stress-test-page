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
    } else {
      this.initWebGL();
    }
  }

  private initWebGL() {
    if (!this.gl) return;
    const gl = this.gl;

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
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        float color = 0.0;
        
        // Massive fixed loop to burn GPU cycles
        for(int i = 0; i < 3000; i++) {
          vec2 p = st * 2.0 - 1.0;
          color += sin(length(p) * 10.0 + u_time + float(i) * 0.01) * 0.0005;
          color += cos(p.x * p.y * 20.0 + u_time * 0.5) * 0.0005;
        }

        gl_FragColor = vec4(vec3(color + 0.1, color * 0.3, 0.4 - color), 1.0);
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

  public start() {
    if (!this.gl || !this.program || this.isRunning) return;
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
