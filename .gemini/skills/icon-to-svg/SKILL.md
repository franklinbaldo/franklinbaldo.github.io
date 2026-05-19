---
name: icon-to-svg
description: Generate high-quality icons using Nanobanana and automatically convert them to smooth, low-color SVGs. Use when a user needs scalable vector icons or illustrations from a text prompt.
---

# Icon to SVG Workflow

This skill automates the process of generating an image icon and converting it into a clean, scalable SVG file.

## Workflow

1.  **Generate with Nanobanana**: Use the `mcp_nanobanana_generate_image` (or `/generate`) command to create a PNG icon.
    *   **Prompt Suggestion**: Use "icon", "minimalist", "watercolor", or "flat design" in your prompt for best results.
    *   **Style**: Prefer `minimalist`, `flat`, or `watercolor` styles.
2.  **Convert to SVG**: Run the bundled Python script to trace the generated PNG and produce a smooth SVG.

## Usage Example

```bash
# 1. Generate the icon (Nanobanana saves to ./nanobanana-output/ by default)
# Note: Identify the filename of the generated image from Nanobanana's output.
/generate "a watercolor monstera leaf icon" --styles=watercolor

# 2. Convert to SVG
python3 scripts/png_to_svg.py ./nanobanana-output/generated_icon.png output.svg --colors 6
```

## Tools & Resources

### Scripts

- **`scripts/png_to_svg.py`**: The core conversion script.
    - **Arguments**:
        - `input_png`: Path to the source PNG.
        - `output_svg`: Path where the SVG should be saved.
        - `--colors` (optional, default 6): Number of colors in the SVG palette.
        - `--min-area` (optional, default 120): Minimum pixel area for a color region to be kept (filters noise).

### Dependencies

Ensure the environment has the following Python packages:
`pip install pillow numpy opencv-python scikit-image`
