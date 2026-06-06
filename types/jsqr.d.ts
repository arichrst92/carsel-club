/**
 * Minimal ambient declaration untuk jsqr v1.4.0.
 *
 * Real types ship dengan jsqr package, ini cuma fallback supaya
 * `npx tsc --noEmit` lewat di sandbox/CI sebelum `npm install`.
 *
 * Setelah `npm install jsqr` di mesin dev, real types ambient
 * dari node_modules/jsqr akan auto-pick-up dan override deklarasi ini.
 */

declare module "jsqr" {
  type Point = { x: number; y: number };
  type QRCode = {
    binaryData: number[];
    data: string;
    chunks: Array<unknown>;
    version: number;
    location: {
      topRightCorner: Point;
      topLeftCorner: Point;
      bottomRightCorner: Point;
      bottomLeftCorner: Point;
      topRightFinderPattern: Point;
      topLeftFinderPattern: Point;
      bottomLeftFinderPattern: Point;
    };
  };
  type Options = {
    inversionAttempts?:
      | "attemptBoth"
      | "dontInvert"
      | "onlyInvert"
      | "invertFirst";
  };
  function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: Options
  ): QRCode | null;
  export default jsQR;
}
