export function interpolateColor(
  fromColor: string,
  toColor: string,
  numberOfShades: number,
): string[] {
  // Ensure the input is valid
  if (numberOfShades < 2) {
    throw new Error('numberOfShades must be at least 2 to provide a range.');
  }

  // Convert hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const validHex = hex.replace('#', '');
    const bigint = parseInt(validHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
  };

  // Convert RGB color to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    const bin = (r << 16) | (g << 8) | b;
    return (function (h) {
      return new Array(7 - h.length).join('0') + h;
    })(bin.toString(16).toUpperCase());
  };

  // Get start and end RGB colors
  const startRgb = hexToRgb(fromColor);
  const endRgb = hexToRgb(toColor);

  // Calculate the intervals for each color
  const stepFactor = 1 / (numberOfShades - 1);
  const shades: string[] = [];

  for (let i = 0; i < numberOfShades; i++) {
    const r = Math.round(
      startRgb[0] * (1 - i * stepFactor) + endRgb[0] * (i * stepFactor),
    );
    const g = Math.round(
      startRgb[1] * (1 - i * stepFactor) + endRgb[1] * (i * stepFactor),
    );
    const b = Math.round(
      startRgb[2] * (1 - i * stepFactor) + endRgb[2] * (i * stepFactor),
    );
    shades.push('#' + rgbToHex(r, g, b));
  }

  return shades;
}

export function getComplementColor(hexcolor: string): string {
  // Remove the hash at the start if it's there
  hexcolor = hexcolor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);

  // Calculate the complement by inverting each RGB component
  const rComplement = (255 - r).toString(16).padStart(2, '0');
  const gComplement = (255 - g).toString(16).padStart(2, '0');
  const bComplement = (255 - b).toString(16).padStart(2, '0');

  // Combine and return the complement color
  return `#${rComplement}${gComplement}${bComplement}`;
}
