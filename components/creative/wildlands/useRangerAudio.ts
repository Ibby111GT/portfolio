"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Weather } from "./trailData";

interface AudioGraph {
  context: AudioContext;
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

function createNoiseBuffer(context: AudioContext) {
  const frameCount = context.sampleRate * 3;
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

function weatherSettings(weather: Weather) {
  if (weather === "Storm") return { gain: 0.065, frequency: 1500 };
  if (weather === "Snow") return { gain: 0.018, frequency: 280 };
  return { gain: 0.014, frequency: 520 };
}

export function useRangerAudio(weather: Weather) {
  const graphRef = useRef<AudioGraph | null>(null);
  const [enabled, setEnabled] = useState(false);

  const ensureGraph = useCallback(() => {
    if (graphRef.current) return graphRef.current;

    const AudioContextConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextConstructor) return null;

    const context = new AudioContextConstructor();
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const settings = weatherSettings(weather);

    source.buffer = createNoiseBuffer(context);
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = settings.frequency;
    gain.gain.value = settings.gain;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();

    const graph = { context, source, filter, gain };
    graphRef.current = graph;
    return graph;
  }, [weather]);

  const toggle = useCallback(async () => {
    const existed = Boolean(graphRef.current);
    const graph = ensureGraph();
    if (!graph) return;
    if (!existed) {
      await graph.context.resume();
      setEnabled(true);
      return;
    }
    if (graph.context.state === "running") {
      await graph.context.suspend();
      setEnabled(false);
    } else {
      await graph.context.resume();
      setEnabled(true);
    }
  }, [ensureGraph]);

  const squelch = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || graph.context.state !== "running") return;
    const now = graph.context.currentTime;
    const oscillator = graph.context.createOscillator();
    const transientGain = graph.context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(140, now);
    oscillator.frequency.exponentialRampToValueAtTime(52, now + 0.13);
    transientGain.gain.setValueAtTime(0.0001, now);
    transientGain.gain.exponentialRampToValueAtTime(0.06, now + 0.012);
    transientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(transientGain);
    transientGain.connect(graph.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.17);
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const settings = weatherSettings(weather);
    const now = graph.context.currentTime;
    graph.filter.frequency.cancelScheduledValues(now);
    graph.filter.frequency.linearRampToValueAtTime(settings.frequency, now + 0.5);
    graph.gain.gain.cancelScheduledValues(now);
    graph.gain.gain.linearRampToValueAtTime(settings.gain, now + 0.5);
  }, [weather]);

  useEffect(
    () => () => {
      const graph = graphRef.current;
      if (!graph) return;
      graph.source.stop();
      void graph.context.close();
      graphRef.current = null;
    },
    [],
  );

  return { enabled, toggle, squelch };
}
