import { useEffect, useRef } from "react";

type RGB = { r: number; g: number; b: number };

export type SplashCursorProps = {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  PRESSURE_ITERATIONS?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLOR_UPDATE_SPEED?: number;
  RAINBOW_MODE?: boolean;
  COLOR?: string;
  className?: string;
};

/**
 * WebGL fluid "splash" cursor trail. Purely decorative:
 * the canvas is fixed, pointer-events: none, and sits behind app UI.
 */
export function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  RAINBOW_MODE = false,
  COLOR = "#ed7520",
  className,
}: SplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const config = {
      SIM_RESOLUTION,
      DYE_RESOLUTION,
      DENSITY_DISSIPATION,
      VELOCITY_DISSIPATION,
      PRESSURE,
      PRESSURE_ITERATIONS,
      CURL,
      SPLAT_RADIUS,
      SPLAT_FORCE,
      SHADING,
      COLOR_UPDATE_SPEED,
      RAINBOW_MODE,
      COLOR,
    };

    type Pointer = {
      texcoordX: number;
      texcoordY: number;
      prevTexcoordX: number;
      prevTexcoordY: number;
      deltaX: number;
      deltaY: number;
      down: boolean;
      moved: boolean;
      color: RGB;
    };

    const newPointer = (): Pointer => ({
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      down: false,
      moved: false,
      color: { r: 0, g: 0, b: 0 },
    });

    const pointers: Pointer[] = [newPointer()];

    /* ---------- context ---------- */
    const params: WebGLContextAttributes = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    let gl = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;
    const isWebGL2 = !!gl;
    if (!gl) {
      gl = (canvas.getContext("webgl", params) ||
        canvas.getContext("experimental-webgl", params)) as unknown as WebGL2RenderingContext | null;
    }
    if (!gl) return;
    const g = gl;

    let halfFloat: OES_texture_half_float | null = null;
    let supportLinearFiltering: unknown = null;
    if (isWebGL2) {
      g.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = g.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = g.getExtension("OES_texture_half_float");
      supportLinearFiltering = g.getExtension("OES_texture_half_float_linear");
    }
    g.clearColor(0, 0, 0, 1);

    const halfFloatTexType = isWebGL2
      ? (g as WebGL2RenderingContext).HALF_FLOAT
      : (halfFloat as unknown as { HALF_FLOAT_OES: number })?.HALF_FLOAT_OES;

    function supportRenderTextureFormat(internalFormat: number, format: number, type: number) {
      const texture = g.createTexture();
      g.bindTexture(g.TEXTURE_2D, texture);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      g.texImage2D(g.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = g.createFramebuffer();
      g.bindFramebuffer(g.FRAMEBUFFER, fbo);
      g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0);
      return g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
    }

    type Fmt = { internalFormat: number; format: number };
    function getSupportedFormat(internalFormat: number, format: number, type: number): Fmt | null {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        const gl2 = g as WebGL2RenderingContext;
        switch (internalFormat) {
          case gl2.R16F:
            return getSupportedFormat(gl2.RG16F, gl2.RG, type);
          case gl2.RG16F:
            return getSupportedFormat(gl2.RGBA16F, g.RGBA, type);
          default:
            return null;
        }
      }
      return { internalFormat, format };
    }

    const gl2 = g as WebGL2RenderingContext;
    const formatRGBA = isWebGL2
      ? getSupportedFormat(gl2.RGBA16F, g.RGBA, halfFloatTexType)
      : getSupportedFormat(g.RGBA, g.RGBA, halfFloatTexType);
    const formatRG = isWebGL2
      ? getSupportedFormat(gl2.RG16F, gl2.RG, halfFloatTexType)
      : getSupportedFormat(g.RGBA, g.RGBA, halfFloatTexType);
    const formatR = isWebGL2
      ? getSupportedFormat(gl2.R16F, gl2.RED, halfFloatTexType)
      : getSupportedFormat(g.RGBA, g.RGBA, halfFloatTexType);

    if (!formatRGBA || !formatRG || !formatR) return;
    if (!supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }

    /* ---------- shader helpers ---------- */
    function hashCode(s: string) {
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    function addKeywords(source: string, keywords?: string[] | null) {
      if (!keywords) return source;
      return keywords.map((k) => `#define ${k}\n`).join("") + source;
    }

    function compileShader(type: number, source: string, keywords?: string[] | null) {
      const shader = g.createShader(type)!;
      g.shaderSource(shader, addKeywords(source, keywords));
      g.compileShader(shader);
      if (!g.getShaderParameter(shader, g.COMPILE_STATUS)) console.warn(g.getShaderInfoLog(shader));
      return shader;
    }

    function createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
      const program = g.createProgram()!;
      g.attachShader(program, vertexShader);
      g.attachShader(program, fragmentShader);
      g.linkProgram(program);
      if (!g.getProgramParameter(program, g.LINK_STATUS)) console.warn(g.getProgramInfoLog(program));
      return program;
    }

    type Uniforms = Record<string, WebGLUniformLocation | null>;
    function getUniforms(program: WebGLProgram): Uniforms {
      const uniforms: Uniforms = {};
      const count = g.getProgramParameter(program, g.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < count; i++) {
        const name = g.getActiveUniform(program, i)!.name;
        uniforms[name] = g.getUniformLocation(program, name);
      }
      return uniforms;
    }

    class Material {
      programs: Record<number, WebGLProgram> = {};
      activeProgram: WebGLProgram | null = null;
      uniforms: Uniforms = {};
      constructor(
        private vertexShader: WebGLShader,
        private fragmentShaderSource: string,
      ) {}
      setKeywords(keywords: string[]) {
        let hash = 0;
        for (const k of keywords) hash += hashCode(k);
        let program = this.programs[hash];
        if (program == null) {
          const fragmentShader = compileShader(g.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
          program = createProgram(this.vertexShader, fragmentShader);
          this.programs[hash] = program;
        }
        if (program === this.activeProgram) return;
        this.uniforms = getUniforms(program);
        this.activeProgram = program;
      }
      bind() {
        if (this.activeProgram) g.useProgram(this.activeProgram);
      }
    }

    class Program {
      program: WebGLProgram;
      uniforms: Uniforms;
      constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
      }
      bind() {
        g.useProgram(this.program);
      }
    }

    const baseVertexShader = compileShader(
      g.VERTEX_SHADER,
      `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
        uniform vec2 texelSize;
        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `,
    );

    const copyShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; uniform sampler2D uTexture;
        void main () { gl_FragColor = texture2D(uTexture, vUv); }
      `,
    );

    const clearShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value;
        void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
      `,
    );

    const displayShaderSource = `
      precision highp float; precision highp sampler2D;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uTexture; uniform vec2 texelSize;
      void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
          #ifdef SHADING
              vec3 lc = texture2D(uTexture, vL).rgb;
              vec3 rc = texture2D(uTexture, vR).rgb;
              vec3 tc = texture2D(uTexture, vT).rgb;
              vec3 bc = texture2D(uTexture, vB).rgb;
              float dx = length(rc) - length(lc);
              float dy = length(tc) - length(bc);
              vec3 n = normalize(vec3(dx, dy, length(texelSize)));
              vec3 l = vec3(0.0, 0.0, 1.0);
              float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
              c *= diffuse;
          #endif
          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
      }
    `;

    const splatShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision highp float; precision highp sampler2D;
        varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio;
        uniform vec3 color; uniform vec2 point; uniform float radius;
        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
      `,
    );

    const advectionShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision highp float; precision highp sampler2D;
        varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;
        uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
            vec2 st = uv / tsize - 0.5;
            vec2 iuv = floor(st); vec2 fuv = fract(st);
            vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
            vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
            vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
            vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
            return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
        void main () {
            #ifdef MANUAL_FILTERING
                vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
                vec4 result = bilerp(uSource, coord, dyeTexelSize);
            #else
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                vec4 result = texture2D(uSource, coord);
            #endif
            float decay = 1.0 + dissipation * dt;
            gl_FragColor = result / decay;
        }
      `,
      supportLinearFiltering ? null : ["MANUAL_FILTERING"],
    );

    const divergenceShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;
            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }
            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
      `,
    );

    const curlShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
      `,
    );

    const vorticityShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision highp float; precision highp sampler2D;
        varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
        uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
        void main () {
            float L = texture2D(uCurl, vL).x;
            float R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;
            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity += force * dt;
            velocity = min(max(velocity, -1000.0), 1000.0);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `,
    );

    const pressureShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
        uniform sampler2D uPressure; uniform sampler2D uDivergence;
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
      `,
    );

    const gradientSubtractShader = compileShader(
      g.FRAGMENT_SHADER,
      `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
        uniform sampler2D uPressure; uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `,
    );

    type FBO = {
      texture: WebGLTexture | null;
      fbo: WebGLFramebuffer | null;
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      attach: (id: number) => number;
    };
    type DoubleFBO = {
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      read: FBO;
      write: FBO;
      swap: () => void;
    };

    const blit = (() => {
      g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), g.STATIC_DRAW);
      g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, g.createBuffer());
      g.bufferData(g.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), g.STATIC_DRAW);
      g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
      g.enableVertexAttribArray(0);
      return (target: FBO | null, clear = false) => {
        if (target == null) {
          g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
          g.bindFramebuffer(g.FRAMEBUFFER, null);
        } else {
          g.viewport(0, 0, target.width, target.height);
          g.bindFramebuffer(g.FRAMEBUFFER, target.fbo);
        }
        if (clear) {
          g.clearColor(0, 0, 0, 1);
          g.clear(g.COLOR_BUFFER_BIT);
        }
        g.drawElements(g.TRIANGLES, 6, g.UNSIGNED_SHORT, 0);
      };
    })();

    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO {
      g.activeTexture(g.TEXTURE0);
      const texture = g.createTexture();
      g.bindTexture(g.TEXTURE_2D, texture);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, param);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, param);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      g.texImage2D(g.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = g.createFramebuffer();
      g.bindFramebuffer(g.FRAMEBUFFER, fbo);
      g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0);
      g.viewport(0, 0, w, h);
      g.clear(g.COLOR_BUFFER_BIT);
      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        attach(id: number) {
          g.activeTexture(g.TEXTURE0 + id);
          g.bindTexture(g.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ): DoubleFBO {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1;
        },
        set read(v: FBO) {
          fbo1 = v;
        },
        get write() {
          return fbo2;
        },
        set write(v: FBO) {
          fbo2 = v;
        },
        swap() {
          const t = fbo1;
          fbo1 = fbo2;
          fbo2 = t;
        },
      };
    }

    function resizeFBO(target: FBO, w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
      const newFBO = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      g.uniform1i(copyProgram.uniforms["uTexture"]!, target.attach(0));
      blit(newFBO);
      return newFBO;
    }

    function resizeDoubleFBO(
      target: DoubleFBO,
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ) {
      if (target.width === w && target.height === h) return target;
      target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w;
      target.height = h;
      target.texelSizeX = 1 / w;
      target.texelSizeY = 1 / h;
      return target;
    }

    const copyProgram = new Program(baseVertexShader, copyShader);
    const clearProgram = new Program(baseVertexShader, clearShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const displayMaterial = new Material(baseVertexShader, displayShaderSource);

    let dye: DoubleFBO | null = null;
    let velocity: DoubleFBO | null = null;
    let divergence: FBO | null = null;
    let curlFBO: FBO | null = null;
    let pressure: DoubleFBO | null = null;

    function getResolution(resolution: number) {
      let aspectRatio = g.drawingBufferWidth / g.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      return g.drawingBufferWidth > g.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = halfFloatTexType;
      const rgba = formatRGBA!;
      const rg = formatRG!;
      const r = formatR!;
      const filtering = supportLinearFiltering ? g.LINEAR : g.NEAREST;
      g.disable(g.BLEND);

      dye = !dye
        ? createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering)
        : resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      velocity = !velocity
        ? createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering)
        : resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, g.NEAREST);
      curlFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, g.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, g.NEAREST);
    }

    displayMaterial.setKeywords(config.SHADING ? ["SHADING"] : []);
    initFramebuffers();

    /* ---------- colors ---------- */
    function hexToRGB(hex: string): RGB {
      let val = hex.replace("#", "");
      if (val.length === 3) val = val[0]! + val[0]! + val[1]! + val[1]! + val[2]! + val[2]!;
      return {
        r: (parseInt(val.slice(0, 2), 16) / 255) * 0.15,
        g: (parseInt(val.slice(2, 4), 16) / 255) * 0.15,
        b: (parseInt(val.slice(4, 6), 16) / 255) * 0.15,
      };
    }

    function HSVtoRGB(h: number, s: number, v: number): RGB {
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0:
          return { r: v, g: t, b: p };
        case 1:
          return { r: q, g: v, b: p };
        case 2:
          return { r: p, g: v, b: t };
        case 3:
          return { r: p, g: q, b: v };
        case 4:
          return { r: t, g: p, b: v };
        default:
          return { r: v, g: p, b: q };
      }
    }

    function generateColor(): RGB {
      if (!config.RAINBOW_MODE) return hexToRGB(config.COLOR);
      const c = HSVtoRGB(Math.random(), 1, 1);
      return { r: c.r * 0.15, g: c.g * 0.15, b: c.b * 0.15 };
    }

    /* ---------- simulation ---------- */
    function correctRadius(radius: number) {
      const aspectRatio = canvas!.width / canvas!.height;
      return aspectRatio > 1 ? radius * aspectRatio : radius;
    }

    function splat(x: number, y: number, dx: number, dy: number, color: RGB) {
      if (!velocity || !dye) return;
      splatProgram.bind();
      g.uniform1i(splatProgram.uniforms["uTarget"]!, velocity.read.attach(0));
      g.uniform1f(splatProgram.uniforms["aspectRatio"]!, canvas!.width / canvas!.height);
      g.uniform2f(splatProgram.uniforms["point"]!, x, y);
      g.uniform3f(splatProgram.uniforms["color"]!, dx, dy, 0);
      g.uniform1f(splatProgram.uniforms["radius"]!, correctRadius(config.SPLAT_RADIUS / 100));
      blit(velocity.write);
      velocity.swap();

      g.uniform1i(splatProgram.uniforms["uTarget"]!, dye.read.attach(0));
      g.uniform3f(splatProgram.uniforms["color"]!, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function splatPointer(p: Pointer) {
      splat(p.texcoordX, p.texcoordY, p.deltaX * config.SPLAT_FORCE, p.deltaY * config.SPLAT_FORCE, p.color);
    }

    function clickSplat(p: Pointer) {
      const c = generateColor();
      splat(p.texcoordX, p.texcoordY, 10 * (Math.random() - 0.5), 30 * (Math.random() - 0.5), {
        r: c.r * 10,
        g: c.g * 10,
        b: c.b * 10,
      });
    }

    function step(dt: number) {
      if (!velocity || !dye || !pressure || !divergence || !curlFBO) return;
      g.disable(g.BLEND);

      curlProgram.bind();
      g.uniform2f(curlProgram.uniforms["texelSize"]!, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(curlProgram.uniforms["uVelocity"]!, velocity.read.attach(0));
      blit(curlFBO);

      vorticityProgram.bind();
      g.uniform2f(vorticityProgram.uniforms["texelSize"]!, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(vorticityProgram.uniforms["uVelocity"]!, velocity.read.attach(0));
      g.uniform1i(vorticityProgram.uniforms["uCurl"]!, curlFBO.attach(1));
      g.uniform1f(vorticityProgram.uniforms["curl"]!, config.CURL);
      g.uniform1f(vorticityProgram.uniforms["dt"]!, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      g.uniform2f(divergenceProgram.uniforms["texelSize"]!, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(divergenceProgram.uniforms["uVelocity"]!, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      g.uniform1i(clearProgram.uniforms["uTexture"]!, pressure.read.attach(0));
      g.uniform1f(clearProgram.uniforms["value"]!, config.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      pressureProgram.bind();
      g.uniform2f(pressureProgram.uniforms["texelSize"]!, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(pressureProgram.uniforms["uDivergence"]!, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        g.uniform1i(pressureProgram.uniforms["uPressure"]!, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gradienSubtractProgram.bind();
      g.uniform2f(gradienSubtractProgram.uniforms["texelSize"]!, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(gradienSubtractProgram.uniforms["uPressure"]!, pressure.read.attach(0));
      g.uniform1i(gradienSubtractProgram.uniforms["uVelocity"]!, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      g.uniform2f(advectionProgram.uniforms["texelSize"]!, velocity.texelSizeX, velocity.texelSizeY);
      if (!supportLinearFiltering)
        g.uniform2f(advectionProgram.uniforms["dyeTexelSize"]!, velocity.texelSizeX, velocity.texelSizeY);
      const velocityId = velocity.read.attach(0);
      g.uniform1i(advectionProgram.uniforms["uVelocity"]!, velocityId);
      g.uniform1i(advectionProgram.uniforms["uSource"]!, velocityId);
      g.uniform1f(advectionProgram.uniforms["dt"]!, dt);
      g.uniform1f(advectionProgram.uniforms["dissipation"]!, config.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      if (!supportLinearFiltering)
        g.uniform2f(advectionProgram.uniforms["dyeTexelSize"]!, dye.texelSizeX, dye.texelSizeY);
      g.uniform1i(advectionProgram.uniforms["uVelocity"]!, velocity.read.attach(0));
      g.uniform1i(advectionProgram.uniforms["uSource"]!, dye.read.attach(1));
      g.uniform1f(advectionProgram.uniforms["dissipation"]!, config.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      if (!dye) return;
      g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
      g.enable(g.BLEND);
      displayMaterial.bind();
      if (config.SHADING)
        g.uniform2f(displayMaterial.uniforms["texelSize"]!, 1 / g.drawingBufferWidth, 1 / g.drawingBufferHeight);
      g.uniform1i(displayMaterial.uniforms["uTexture"]!, dye.read.attach(0));
      blit(null);
    }

    const scaleByPixelRatio = (input: number) => Math.floor(input * (window.devicePixelRatio || 1));

    function resizeCanvas() {
      const width = scaleByPixelRatio(canvas!.clientWidth);
      const height = scaleByPixelRatio(canvas!.clientHeight);
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
        return true;
      }
      return false;
    }

    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0;
    let raf = 0;
    let disposed = false;

    function updateFrame() {
      if (disposed) return;
      const now = Date.now();
      const dt = Math.min((now - lastUpdateTime) / 1000, 0.016666);
      lastUpdateTime = now;

      if (resizeCanvas()) initFramebuffers();

      colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer = colorUpdateTimer % 1;
        pointers.forEach((p) => {
          p.color = generateColor();
        });
      }

      pointers.forEach((p) => {
        if (p.moved) {
          p.moved = false;
          splatPointer(p);
        }
      });

      step(dt);
      render();
      raf = requestAnimationFrame(updateFrame);
    }

    /* ---------- input ---------- */
    const correctDeltaX = (delta: number) => {
      const ar = canvas.width / canvas.height;
      return ar < 1 ? delta * ar : delta;
    };
    const correctDeltaY = (delta: number) => {
      const ar = canvas!.width / canvas!.height;
      return ar > 1 ? delta / ar : delta;
    };

    function updatePointerDownData(p: Pointer, posX: number, posY: number) {
      p.down = true;
      p.moved = false;
      p.texcoordX = posX / canvas!.width;
      p.texcoordY = 1 - posY / canvas!.height;
      p.prevTexcoordX = p.texcoordX;
      p.prevTexcoordY = p.texcoordY;
      p.deltaX = 0;
      p.deltaY = 0;
      p.color = generateColor();
    }

    function updatePointerMoveData(p: Pointer, posX: number, posY: number, color: RGB) {
      p.prevTexcoordX = p.texcoordX;
      p.prevTexcoordY = p.texcoordY;
      p.texcoordX = posX / canvas!.width;
      p.texcoordY = 1 - posY / canvas!.height;
      p.deltaX = correctDeltaX(p.texcoordX - p.prevTexcoordX);
      p.deltaY = correctDeltaY(p.texcoordY - p.prevTexcoordY);
      p.moved = Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0;
      p.color = color;
    }

    const onMouseDown = (e: MouseEvent) => {
      const p = pointers[0]!;
      updatePointerDownData(p, scaleByPixelRatio(e.clientX), scaleByPixelRatio(e.clientY));
      clickSplat(p);
    };

    let firstMove = true;
    const onMouseMove = (e: MouseEvent) => {
      const p = pointers[0]!;
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      if (firstMove) {
        firstMove = false;
        updatePointerDownData(p, posX, posY);
        return;
      }
      updatePointerMoveData(p, posX, posY, p.color);
    };

    const onTouchStart = (e: TouchEvent) => {
      const p = pointers[0]!;
      for (const t of Array.from(e.targetTouches)) {
        updatePointerDownData(p, scaleByPixelRatio(t.clientX), scaleByPixelRatio(t.clientY));
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const p = pointers[0]!;
      for (const t of Array.from(e.targetTouches)) {
        updatePointerMoveData(p, scaleByPixelRatio(t.clientX), scaleByPixelRatio(t.clientY), p.color);
      }
    };

    const onTouchEnd = () => {
      pointers[0]!.down = false;
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    updateFrame();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      const lose = g.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    };
  }, [
    SIM_RESOLUTION,
    DYE_RESOLUTION,
    DENSITY_DISSIPATION,
    VELOCITY_DISSIPATION,
    PRESSURE,
    PRESSURE_ITERATIONS,
    CURL,
    SPLAT_RADIUS,
    SPLAT_FORCE,
    SHADING,
    COLOR_UPDATE_SPEED,
    RAINBOW_MODE,
    COLOR,
  ]);

  return (
    <div className={className ?? "splash-cursor-layer"} aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export default SplashCursor;
