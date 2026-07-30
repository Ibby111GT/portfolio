// Synthesized engine tone for the test cell. No audio files — three
// sawtooth partials through a lowpass, pitch following rpm. The context is
// created lazily inside setEnabled(true), which only ever runs from the
// toggle button's click handler, so the browser autoplay policy is satisfied
// and StrictMode's double-mount never constructs anything. Gain follows a
// single policy in applyGain(): audible only while enabled AND a run is in
// progress, so toggling audio while idle stays silent and launches ramp in.

export interface EngineAudio {
  setEnabled: (on: boolean) => void;
  isEnabled: () => boolean;
  update: (rpm: number) => void;
  onShift: () => void;
  startRun: () => void;
  stopRun: () => void;
  dispose: () => void;
}

const PARTIALS = [
  { multiple: 1, gain: 1 },
  { multiple: 2, gain: 0.45 },
  { multiple: 3, gain: 0.2 },
];
const MASTER_LEVEL = 0.05;

export function createEngineAudio(): EngineAudio {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let oscillators: Array<{ osc: OscillatorNode; multiple: number }> = [];
  let enabled = false;
  let running = false;
  let disposed = false;

  function build() {
    if (context || disposed) {
      return;
    }
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.7;
    master.connect(filter);
    filter.connect(context.destination);
    oscillators = PARTIALS.map(({ multiple, gain }) => {
      const osc = context!.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 30 * multiple;
      const partialGain = context!.createGain();
      partialGain.gain.value = gain;
      osc.connect(partialGain);
      partialGain.connect(master!);
      osc.start();
      return { osc, multiple };
    });
  }

  // The one place gain policy lives: audible only while enabled AND running.
  function applyGain() {
    if (!context || !master || disposed) {
      return;
    }
    const target = enabled && running ? MASTER_LEVEL : 0;
    master.gain.setTargetAtTime(target, context.currentTime, 0.08);
  }

  return {
    setEnabled(on: boolean) {
      if (disposed) {
        return;
      }
      enabled = on;
      if (on) {
        build();
        void context?.resume();
      }
      applyGain();
    },
    isEnabled() {
      return enabled;
    },
    update(rpm: number) {
      if (!enabled || !context || disposed) {
        return;
      }
      const base = 30 + (rpm / 8500) * 90;
      oscillators.forEach(({ osc, multiple }) => {
        osc.frequency.setTargetAtTime(
          base * multiple,
          context!.currentTime,
          0.02,
        );
      });
    },
    onShift() {
      if (!enabled || !running || !context || !master || disposed) {
        return;
      }
      const now = context.currentTime;
      master.gain.setTargetAtTime(MASTER_LEVEL * 0.3, now, 0.02);
      master.gain.setTargetAtTime(MASTER_LEVEL, now + 0.08, 0.03);
    },
    startRun() {
      if (disposed) {
        return;
      }
      running = true;
      applyGain();
    },
    stopRun() {
      if (disposed) {
        return;
      }
      running = false;
      applyGain();
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      enabled = false;
      running = false;
      oscillators.forEach(({ osc }) => {
        try {
          osc.stop();
        } catch {
          // Already stopped.
        }
      });
      oscillators = [];
      void context?.close().catch(() => {});
      context = null;
      master = null;
    },
  };
}
