# Project High Sun structure

This directory is the isolated home-console project for **Nahar Meridian NMC-01** and **Daybreak OS Meridian**.

```text
meridian/
├── index.html              # Meridian-only application shell
├── README.md               # Meridian usage and controls
├── PROJECT_STRUCTURE.md    # Project boundary and source map
├── manifest.webmanifest    # Installable web-app identity
├── high-sun.svg            # Meridian application icon
├── sw.js                   # Meridian-only offline cache
├── styles/
│   ├── system.css          # Core palette, boot, shell and Horizon structure
│   ├── worlds.css          # Five launch-world presentation environments
│   └── interface.css       # Panels, overlay, touch controls and accessibility
├── scripts/
│   ├── core.js             # Worlds, system spaces, state and overlays
│   ├── games.js            # Five playable Canvas demonstrations
│   └── input.js            # Keyboard, gamepad, touch and initialization
└── .project-scope          # Explicit isolation rule
```

## Boundary

The repository root is reserved for **Nahar Pico / Project Small Sun**. Every High Sun implementation file stays beneath `meridian/`. Meridian may simulate a Pico connection, but it does not import, rename, overwrite or depend on Pico source code.

## Runtime scope

The Meridian service worker uses `./` as its scope and caches only files inside `meridian/`. Browser storage uses the separate `highSunState` key, so it does not share save state with the Pico showcase.

## Next modules

Future work remains inside this directory:

```text
meridian/
├── worlds/                 # Deeper game-specific modules and data
├── audio/                  # Boot motif and system cues
├── assets/                 # Meridian-only visual material
└── tests/                  # Navigation, persistence and input checks
```
