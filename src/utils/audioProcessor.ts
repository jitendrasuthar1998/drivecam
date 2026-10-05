/**
 * Studio-Grade Web Audio Pipeline
 * Features:
 * - BiquadFilterNode (High-pass filter at 80Hz with Q factor to cut HVAC, mic handling noise, wind rumble)
 * - AnalyserNode for live VU meter visualization
 * - MediaStreamAudioDestinationNode to pipe processed studio audio back into MediaRecorder
 * - Synthetic sound effects (shutter click & record beep) without external assets
 */

export class StudioAudioProcessor {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  constructor() {}

  /**
   * Initialize or resume audio context
   */
  public async initContext(): Promise<AudioContext> {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Process an incoming raw audio track through high-pass filter and return the processed track
   */
  public async processStream(
    inputStream: MediaStream,
    useFilter: boolean = true,
    cutoffHz: number = 80
  ): Promise<{ processedStream: MediaStream; getAudioLevel: () => number }> {
    const audioTrack = inputStream.getAudioTracks()[0];
    if (!audioTrack) {
      return {
        processedStream: inputStream,
        getAudioLevel: () => 0,
      };
    }

    const ctx = await this.initContext();

    // Clean up any existing nodes
    this.cleanupNodes();

    // Create stream source
    this.sourceNode = ctx.createMediaStreamSource(inputStream);

    // Create 80Hz High-Pass Filter (removes rumble, air conditioner hum, wind)
    this.highPassFilter = ctx.createBiquadFilter();
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.setValueAtTime(cutoffHz, ctx.currentTime);
    this.highPassFilter.Q.setValueAtTime(0.707, ctx.currentTime); // Butterworth flat response

    // Create Analyser for real-time visualizer
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;
    this.dataArray = new Uint8Array(new ArrayBuffer(this.analyserNode.frequencyBinCount));

    // Create destination for MediaRecorder
    this.destinationNode = ctx.createMediaStreamDestination();

    // Routing
    if (useFilter) {
      this.sourceNode.connect(this.highPassFilter);
      this.highPassFilter.connect(this.analyserNode);
      this.highPassFilter.connect(this.destinationNode);
    } else {
      this.sourceNode.connect(this.analyserNode);
      this.sourceNode.connect(this.destinationNode);
    }

    const getAudioLevel = (): number => {
      if (!this.analyserNode || !this.dataArray) return 0;
      this.analyserNode.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / this.dataArray.length;
      // Normalize to 0 - 100 with a slight boost for readability
      return Math.min(100, Math.round((avg / 128) * 100));
    };

    return {
      processedStream: this.destinationNode.stream,
      getAudioLevel,
    };
  }

  /**
   * Play tactile camera shutter click sound
   */
  public playShutterSound(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const now = ctx.currentTime;
      // Mechanical click 1 (curtain open)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(450, now);
      osc1.frequency.exponentialRampToValueAtTime(80, now + 0.04);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.05);

      // Mechanical click 2 (curtain close)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.13);

      setTimeout(() => {
        ctx.close();
      }, 300);
    } catch {
      // Audio autoplay might be restricted before user gesture
    }
  }

  /**
   * Play record start/stop beep
   */
  public playBeep(isStart: boolean): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isStart) {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.08);
      } else {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(450, now + 0.08);
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);

      setTimeout(() => {
        ctx.close();
      }, 300);
    } catch {
      // Audio autoplay might be restricted
    }
  }

  private cleanupNodes(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }
    if (this.highPassFilter) {
      try {
        this.highPassFilter.disconnect();
      } catch {
        // ignore
      }
      this.highPassFilter = null;
    }
    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {
        // ignore
      }
      this.analyserNode = null;
    }
  }

  public destroy(): void {
    this.cleanupNodes();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {
        // ignore
      }
      this.audioCtx = null;
    }
  }
}
