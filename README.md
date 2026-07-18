# Daybreak OS Web Showcases

Interactive browser prototypes for the fictional **Nahar Works** console family.

## Nahar Pico — Project Small Sun

The repository root contains the portable **Nahar Pico NPC-01** Daybreak OS showcase.

Features:

- Animated Daybreak OS boot sequence
- Shelf-style monochrome console dashboard
- Five interactive games: Mothwell, Dune Signal, Black Falcon, 100 Doors, and Coin Saint
- Light Memory high scores using browser localStorage
- Settings and system diagnostics
- Keyboard, mouse, and touch controls
- Responsive desktop and mobile layout

Open with GitHub Pages:

`https://f178.github.io/DayBreak/`

## Nahar Meridian — Project High Sun

The `meridian/` folder contains the more powerful home-console prototype, **Nahar Meridian NMC-01**.

Features:

- Cinematic Daybreak OS Meridian boot
- The Horizon game-world dashboard
- Five launch worlds with interactive Canvas demonstrations
- Archive, Sessions, Light Memory, Observatory, Signal, and Workshop
- Nahar Axis controller mapping
- Keyboard, gamepad, mouse, and purpose-built touchscreen controls
- Simulated World Keys, Nahar Pico connection, Marks, captures, downloads, and power states
- Persistent browser state and accessibility settings

Open with GitHub Pages:

`https://f178.github.io/DayBreak/meridian/`

## Run locally

Open either `index.html` directly, or serve the repository with any static server:

```bash
python -m http.server 8080
```

Then open:

- Pico: `http://localhost:8080/`
- Meridian: `http://localhost:8080/meridian/`

All visual assets, interfaces, worlds, and game concepts are original to Nahar Works, Project Small Sun, and Project High Sun.
