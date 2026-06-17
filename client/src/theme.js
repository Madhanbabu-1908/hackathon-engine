// ============================================================
// theme.js — Centralized Theme Configuration
// Change ACTIVE_THEME to switch the entire app color scheme.
// Options: 'ember' | 'navy' | 'aurora' | 'obsidian'
// ============================================================

const ACTIVE_THEME = 'original'; // ← CHANGE THIS ONE VALUE

const themes = {

  original: {
  bg: '#050810', bgCard: '#0a1628',
  teal: '0,212,200', gold: '240,165,0', purple: '124,58,237',
  red: '255,59,92', green: '0,230,118', scrollbar: '#00d4c8',
  },


  // Ember Core — warm orange/amber on near-black
  ember: {
    bg:         '#0C0806',
    bgCard:     '#1A1008',
    teal:       '255,107,43',   // primary accent (orange)
    gold:       '255,215,0',    // secondary accent (yellow-gold)
    purple:     '255,45,85',    // tertiary accent (crimson)
    red:        '255,45,85',
    green:      '0,230,118',
    scrollbar:  '#FF6B2B',
  },

  // Royal Navy — deep navy, white, gold
  navy: {
    bg:         '#060D1A',
    bgCard:     '#0A1628',
    teal:       '184,150,12',   // primary accent (gold)
    gold:       '255,255,255',  // secondary accent (white)
    purple:     '192,57,43',    // tertiary accent (crimson)
    red:        '192,57,43',
    green:      '39,174,96',
    scrollbar:  '#B8960C',
  },
// Tata Consultancy Services — professional hues: blue, white, soft orange
tcsTheme: {
  bg:          '#F8FAFC',        // light and clean background
  bgCard:      '#E3EDF7',        // slightly darker card background for contrast
  primary:     '30,67,134',      // primary accent (TCS blue)
  secondary:   '255,127,63',     // secondary accent (vibrant soft orange)
  tertiary:    '220,53,69',      // tertiary accent (vivid red for highlights)
  textColor:   '#1A1A1A',        // dark text for readability
  red:         '211,47,47',      // for error or warnings
  green:       '56,142,60',      // for success highlights
  scrollbar:   '#B0C4DE',        // soft, muted scrollbar color
},
  // Aurora Borealis — dark green, electric cyan, violet
aurora: {
    bg:         '#060F0F',
    bgCard:     '#0A1A1A',
    teal:       '0,255,200',    // primary accent (electric cyan)
    gold:       '191,95,255',   // secondary accent (violet)
    purple:     '255,79,123',   // tertiary accent (pink-red)
    red:        '255,79,123',
    green:      '0,255,200',
    scrollbar:  '#00FFC8',
  },

  // Executive Obsidian — charcoal, platinum silver, amber
  obsidian: {
    bg:         '#0D0D0D',
    bgCard:     '#1A1A1A',
    teal:       '192,192,192',  // primary accent (platinum)
    gold:       '212,160,23',   // secondary accent (amber)
    purple:     '224,92,92',    // tertiary accent (muted red)
    red:        '224,92,92',
    green:      '100,200,120',
    scrollbar:  '#C0C0C0',
  },

  // Neon Noir — hot pink + electric blue on pure black
neon_noir: {
  bg: '#000000', bgCard: '#0D0D0D',
  teal: '0,240,255', gold: '255,0,128', purple: '180,0,255',
  red: '255,0,128', green: '0,255,128', scrollbar: '#00F0FF',
},

// Arctic Frost — ice blue + white + silver on deep slate
arctic: {
  bg: '#080E14', bgCard: '#0F1820',
  teal: '120,220,255', gold: '255,255,255', purple: '100,160,220',
  red: '255,100,100', green: '100,255,200', scrollbar: '#78DCFF',
},

// Saffron Storm — deep saffron + turmeric gold on dark brown (India-inspired)
saffron: {
  bg: '#0C0800', bgCard: '#1A1000',
  teal: '255,153,0', gold: '255,220,50', purple: '200,50,50',
  red: '200,50,50', green: '50,200,100', scrollbar: '#FF9900',
},

// Cyber Mint — mint green + lime on charcoal (fresh, modern)
cyber_mint: {
  bg: '#060C08', bgCard: '#0C1610',
  teal: '0,255,160', gold: '180,255,50', purple: '0,200,120',
  red: '255,80,80', green: '0,255,160', scrollbar: '#00FFA0',
},

// Volcanic — lava red + ash white on near-black
volcanic: {
  bg: '#0A0500', bgCard: '#180A00',
  teal: '255,80,20', gold: '255,200,100', purple: '200,30,30',
  red: '255,30,30', green: '100,220,100', scrollbar: '#FF5014',
},

// Deep Ocean — bioluminescent cyan + deep teal on midnight blue
ocean: {
  bg: '#020810', bgCard: '#04101E',
  teal: '0,220,255', gold: '0,255,200', purple: '80,100,255',
  red: '255,80,120', green: '0,255,180', scrollbar: '#00DCFF',
},

// Rose Gold — warm rose + champagne gold on dark charcoal (elegant)
rose_gold: {
  bg: '#0C0808', bgCard: '#1A1010',
  teal: '220,120,140', gold: '212,175,115', purple: '180,80,100',
  red: '220,60,80', green: '100,200,140', scrollbar: '#DC7888',
},

// Phantom — muted violet + silver on deep purple-black (mysterious)
phantom: {
  bg: '#08060F', bgCard: '#100C1E',
  teal: '160,120,255', gold: '200,180,255', purple: '120,80,220',
  red: '220,80,120', green: '80,220,160', scrollbar: '#A078FF',
},

};

export const theme = themes[ACTIVE_THEME];

// Helper — returns rgba string with opacity
// Usage: rgba(T.teal, 0.2)  →  'rgba(255,107,43,0.2)'
export const rgba = (colorKey, opacity = 1) =>
  `rgba(${theme[colorKey]},${opacity})`;

// Named shortcuts for common use
export const T = theme;
