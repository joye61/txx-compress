declare module "svgo/lib/svgo" {
  export default {
    optimize(
      input: string,
      plugins: any
    ): {
      data: string;
    };,
  };
}

declare module "./upng" {
  export namespace UPNG {
    export function encode(
      imgs: ArrayBuffer[],
      w: number,
      h: number,
      cnum: number
    ): ArrayBuffer;
  }
}
