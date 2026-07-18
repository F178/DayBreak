# Project High Sun structure

This directory is the isolated home-console project for **Nahar Meridian NMC-01** and **Daybreak OS Meridian**.

```text
meridian/
├── index.html              # Meridian entry point
├── README.md               # Meridian-specific usage and controls
├── PROJECT_STRUCTURE.md    # This project boundary and roadmap
├── manifest.webmanifest    # Installable web-app identity
├── high-sun.svg            # Meridian application icon
├── sw.js                   # Meridian-only offline cache
└── .project-scope          # Explicit isolation rule
```

## Boundary

The parent repository root is reserved for **Nahar Pico / Project Small Sun**. High Sun work stays in this folder. Meridian can simulate a Pico connection, but does not modify or import Pico application code.

## Next source split

The current prototype remains self-contained while it is stabilized. Its next refactor will stay inside this directory:

```text
meridian/
├── styles/
├── scripts/
├── worlds/
├── audio/
└── assets/
```

No Pico file needs to move for that refactor.
