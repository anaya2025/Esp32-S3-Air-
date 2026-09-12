import { RadioStation, EqPreset } from '../types';

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'soma-groovesalad',
    name: 'SomaFM Groove Salad',
    genre: 'Ambient / Chillout',
    country: 'USA',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    bitrate: 128,
    codec: 'MP3',
    description: 'A nicely chilled plate of ambient/downtempo beats and grooves. Perfect for high-fidelity DAC listening.',
  },
  {
    id: 'soma-secretagent',
    name: 'SomaFM Secret Agent',
    genre: 'Spy / Lounge / Surf',
    country: 'USA',
    streamUrl: 'https://ice2.somafm.com/secretagent-128-mp3',
    bitrate: 128,
    codec: 'MP3',
    description: 'The soundtrack for your stylish, mysterious life. An eclectic blend of spy-fi lounge music.',
  },
  {
    id: 'ilove-chillhop',
    name: 'I Love Lofi & Chillhop',
    genre: 'Lofi Hip Hop / Chill',
    country: 'Germany',
    streamUrl: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    bitrate: 192,
    codec: 'MP3',
    description: 'Smooth relaxing lofi beats, vinyl crackles, warm sub-bass, and jazzy Rhodes chords.',
  },
  {
    id: 'swiss-classic',
    name: 'Radio Swiss Classic',
    genre: 'Classical / Symphonic',
    country: 'Switzerland',
    streamUrl: 'http://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    bitrate: 128,
    codec: 'MP3',
    description: 'Serene classical masterpieces, orchestral suites, and acoustic purity tested on UDA1334A DAC.',
  },
  {
    id: 'soma-spacestation',
    name: 'SomaFM Space Station',
    genre: 'Synthwave / Ambient Space',
    country: 'USA',
    streamUrl: 'https://ice1.somafm.com/spacestation-128-mp3',
    bitrate: 128,
    codec: 'MP3',
    description: 'Deep mid-tempo synth electronics for space exploration and late night coding sessions.',
  },
  {
    id: 'soma-sonicuniverse',
    name: 'SomaFM Sonic Universe',
    genre: 'Nu Jazz / Avant-Garde',
    country: 'USA',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    bitrate: 128,
    codec: 'MP3',
    description: 'Transcending the world of jazz with modern electronic nu-jazz and contemporary improvisation.',
  },
  {
    id: 'soma-indiepop',
    name: 'SomaFM Indie Pop Rocks',
    genre: 'Indie Rock / Alternative',
    country: 'USA',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
    bitrate: 128,
    codec: 'MP3',
    description: 'New and classic favorite indie pop tracks with crisp electric guitars and driving percussion.',
  }
];

export const TEST_AUDIO_STREAMS: RadioStation[] = [
  {
    id: 'kexp-flac-test',
    name: 'KEXP 90.3 FM Seattle (Lossless CD Quality)',
    genre: 'Alternative / Lossless Test',
    country: 'USA',
    streamUrl: 'https://kexp.streamguys1.com/kexp160.mp3',
    bitrate: 160,
    codec: 'MP3',
    description: 'Legendary Seattle listener-powered station with pristine dynamic range and acoustic depth.',
  },
  {
    id: 'linn-audiophile-test',
    name: 'Linn Classical (Audiophile 320k Studio Master)',
    genre: 'Classical / Audiophile Master',
    country: 'UK',
    streamUrl: 'https://radio.linn.co.uk:8003/autodj',
    bitrate: 320,
    codec: 'MP3',
    description: 'Linn Records precision-mastered studio reference stream for testing UDA1334A I2S DAC clarity.',
  },
  {
    id: 'bbc-radio1-test',
    name: 'BBC Radio 1 Direct (High-Efficiency AAC)',
    genre: 'Dance & Pop / AAC Test',
    country: 'UK',
    streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    bitrate: 128,
    codec: 'AAC',
    description: 'Direct live AAC digital feed from BBC Broadcasting House London.',
  },
  {
    id: 'worldwide-fm-test',
    name: 'Worldwide FM London (Global Eclectic & Jazz)',
    genre: 'World / Jazz / Rare Grooves',
    country: 'UK',
    streamUrl: 'https://worldwidefm.out.airtime.pro/worldwidefm_a',
    bitrate: 192,
    codec: 'MP3',
    description: 'Gilles Peterson curated underground jazz, ambient soundscapes, and global rhythms.',
  },
  {
    id: 'fip-france-test',
    name: 'FIP Radio France (High Quality Stereo HLS)',
    genre: 'Eclectic Fusion / Stereo Separation',
    country: 'France',
    streamUrl: 'https://stream.radiofrance.fr/fip/fip.m3u8?id=radiofrance',
    bitrate: 192,
    codec: 'AAC',
    description: 'Commercial-free French radio with pristine stereo separation and wide soundstage.',
  },
  {
    id: 'wnyc-npr-test',
    name: 'WNYC 93.9 FM New York (NPR Direct Vocal Test)',
    genre: 'Vocal Midrange / Spoken Word',
    country: 'USA',
    streamUrl: 'https://fm939.wnyc.org/wnycfm-web',
    bitrate: 128,
    codec: 'AAC',
    description: 'Spoken word dialogue test for mid-range clarity, vocal sibilance, and speech timbre.',
  }
];

export const EQ_PRESETS: EqPreset[] = [
  {
    id: 'flat',
    name: 'Flat / Studio Direct',
    bass: 0,
    mid: 0,
    treble: 0,
    description: 'Pure unaltered bit-perfect response directly sent to UDA1334A I2S DAC.'
  },
  {
    id: 'bass_boost',
    name: 'Bass Boost (+6dB)',
    bass: 6,
    mid: 0,
    treble: 1,
    description: 'Warm, punchy low-end emphasis for headphones, bookshelf speakers, and EDM/Hip-Hop.'
  },
  {
    id: 'rock',
    name: 'Rock / Dynamic',
    bass: 4,
    mid: -1.5,
    treble: 4.5,
    description: 'Classic smile EQ curve bringing out punchy bass drums and electric guitar bite.'
  },
  {
    id: 'jazz',
    name: 'Smooth Jazz',
    bass: 3,
    mid: 2,
    treble: 2.5,
    description: 'Enhanced acoustic warmth, rich saxophone mid-range, and silky ride cymbal sheen.'
  },
  {
    id: 'vocal',
    name: 'Vocal Clarity',
    bass: -2,
    mid: 5,
    treble: 3,
    description: 'Focused mid-range for spoken word, podcasts, acoustic vocal performances, and news.'
  },
  {
    id: 'electronic',
    name: 'Electronic / Club',
    bass: 5.5,
    mid: 0.5,
    treble: 5,
    description: 'Sub-bass extension with sparkling synth transients and crisp hi-hat definition.'
  },
  {
    id: 'acoustic',
    name: 'Acoustic / Folk',
    bass: 2,
    mid: 2.5,
    treble: 3.5,
    description: 'Natural timbre for wooden instruments, acoustic guitars, cellos, and delicate vocals.'
  },
  {
    id: 'classical',
    name: 'Concert Hall',
    bass: 3,
    mid: 0,
    treble: 2,
    description: 'Spacious dynamic response suited for symphonic works, brass dynamics, and violin detail.'
  },
  {
    id: 'custom',
    name: 'Custom User Curve',
    bass: 0,
    mid: 0,
    treble: 0,
    description: 'Freely configured parametric 3-band tone offsets.'
  }
];

export const DEFAULT_PARTITIONS = [
  { name: 'nvs', type: 'data', subtype: 'nvs', offset: '0x009000', size: '24 KB', flags: 'Read/Write', active: false },
  { name: 'otadata', type: 'data', subtype: 'ota', offset: '0x00f000', size: '8 KB', flags: 'Read/Write', active: false },
  { name: 'phy_init', type: 'data', subtype: 'phy', offset: '0x011000', size: '4 KB', flags: 'Read Only', active: false },
  { name: 'ota_0', type: 'app', subtype: 'ota_0', offset: '0x020000', size: '4096 KB (4MB)', flags: 'Boot Partition', active: true },
  { name: 'ota_1', type: 'app', subtype: 'ota_1', offset: '0x420000', size: '4096 KB (4MB)', flags: 'Next OTA Target', active: false },
  { name: 'spiffs', type: 'data', subtype: 'spiffs', offset: '0x820000', size: '4096 KB (4MB)', flags: 'Web Assets & Certs', active: false },
  { name: 'coredump', type: 'data', subtype: 'coredump', offset: '0xC20000', size: '64 KB', flags: 'Crash Dumps', active: false },
  { name: 'storage', type: 'data', subtype: 'fat', offset: '0xC30000', size: '3904 KB (3.9MB)', flags: 'Audio Cache', active: false }
];
