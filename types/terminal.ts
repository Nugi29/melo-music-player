export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'system';
  content: string;
  timestamp: number;
}

export interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  aliases?: string[];
  examples?: string[];
}
