export type Preset = 'low' | 'medium' | 'high' | 'extreme' | 'custom';

export type SequenceBlockType = 'run' | 'cooldown';

export interface SequenceBlock {
  id: string;
  type: SequenceBlockType;
  durationSeconds: number;
}

export interface TestSequence {
  blocks: SequenceBlock[];
  loops: number; // 0 means infinite
}
