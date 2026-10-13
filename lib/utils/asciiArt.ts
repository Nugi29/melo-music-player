export const ASCII_LOGO = `
 ███▄ ▄███▓▓█████  ██▓     ▒█████      ▒█████    ██████ 
▓██▒▀█▀ ██▒▓█   ▀ ▓██▒    ▒██▒  ██▒   ▒██▒  ██▒▒██    ▒ 
▓██    ▓██░▒███   ▒██░    ▒██░  ██▒   ▒██░  ██▒░ ▓██▄   
▒██    ▒██  ▒▓█  ▄ ▒██░    ▒██   ██░   ▒██   ██░  ▒   ██▒
▒██▒   ░██▒░▒████▒░██████▒░ ████▓▒░    ░ ████▓▒░▒██████▒▒
░ ▒░   ░  ░░░ ▒░ ░░ ▒░▓  ░░ ▒░▒░▒░     ░ ▒░▒░▒░ ▒ ▒▓▒ ▒ ░
`;

export const ALBUM_ASCII_ART_PRESETS: string[] = [
  // Preset 0: Vinyl Disk
  `    :!???JJ?!:     
   ?#@@@@@@@@&?.   
 .B@@@@@@@@@@@@#~  
 7@@@@@@@@@@@@@@&^ 
 5@@@@@@@@@@@@@@@! 
 7@@#JJ5B&@@@@@@@! 
  Y#J.  .~5@@@@@Y  
  ^&@#P?^:^?#@@@7  
  :B@@@@&&@@@@B.  
   !&@@@@@@@@@&!   
    ~5&@@@@@&P^    
      .^~!!~:.     `,

  // Preset 1: Cassette Tape
  `+==================+
|[::]  NUGI_TAPE  |
| ________________ |
| [ O ]      [ O ] |
|  ===________===  |
|      ======      |
+==================+`,

  // Preset 2: Cyber Skull / Synth Head
  `    .---.      .---.   
   /     \\    /     \\  
  | () () |  | () () | 
   \\     /    \\     /  
    '---' .--. '---'   
         /    \\        
        | <==> |       
         '----'        `,

  // Preset 3: Audio Waveform Grid
  ` /\\  |  /\\  |  /\\   
/  \\ | /  \\ | /  \\  
    \\|/    \\|/    \\ 
====================
   ASCII AUDIO 1.0  
====================`
];

export function getRandomAsciiArt(seed?: string): string {
  if (!seed) return ALBUM_ASCII_ART_PRESETS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ALBUM_ASCII_ART_PRESETS.length;
  return ALBUM_ASCII_ART_PRESETS[index];
}
