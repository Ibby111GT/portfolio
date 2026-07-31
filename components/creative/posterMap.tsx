import type { ComponentType } from "react";
import SignalBloomPoster from "@/components/creative/SignalBloomPoster";
import {
  BiospherePoster,
  ContinuumPoster,
  LumenCityPoster,
  SentinelPoster,
  VerdantPoster,
} from "@/components/creative/GenerativePosters";
import {
  BlocktownPoster,
  EchoMazePoster,
  FrameforgePoster,
  LanternValePoster,
  SlipstreamPoster,
} from "@/components/creative/PlayablePosters";
import {
  AutomataPoster,
  LoadPathPoster,
  MurmurationPoster,
  TerraformPoster,
} from "@/components/creative/SystemPosters";

/**
 * One poster per imageless creative entry. tests/catalog.test.ts asserts that
 * every `image: null` project has an entry here, so a missing poster fails
 * `npm test` instead of silently rendering some other project's artwork.
 */
export const POSTERS: Record<string, ComponentType> = {
  "signal-bloom": SignalBloomPoster,
  "sentinel-observatory": SentinelPoster,
  verdant: VerdantPoster,
  "lumen-city": LumenCityPoster,
  "continuum-engine": ContinuumPoster,
  "digital-biosphere": BiospherePoster,
  murmuration: MurmurationPoster,
  "automata-atlas": AutomataPoster,
  "load-path": LoadPathPoster,
  terraform: TerraformPoster,
  "blocktown-stories": BlocktownPoster,
  "slipstream-circuit": SlipstreamPoster,
  "lantern-vale": LanternValePoster,
  frameforge: FrameforgePoster,
  "echo-maze": EchoMazePoster,
};
