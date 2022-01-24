import { ImageMime } from "./const";
import svgo from "svgo/lib/svgo";
import { UPNG } from "./upng";
import { getExtensionByType, isTypeSupport } from "./util";

export interface ScaleOption {
  /**
   * Scaling type to ensure that the scaling ratio of width and height is consistent and not distorted
   * 1、Scaling to percentage, width and height at the same time
   * 2、Width scaling to fixed value, height adaptive isometric scaling
   * 3、Height scaling to fixed value, width adaptive isometric scaling
   */
  type?: "percent" | "width" | "height";
  // Value 1-100 when type is percent
  percent?: number;
  // The value when type is width
  width?: number;
  // The value when type is height
  height?: number;
}

export interface CompressOption {
  // Compression mass 1-100, the higher the mass the larger the size
  quality?: number;
  scale?: ScaleOption;
}

export type ImageSource = Blob | File | HTMLImageElement | string;

export class TxxCompress {
  type?: ImageMime;
  file?: Blob;
  image?: HTMLImageElement;
  size?: number;
  width?: number;
  height?: number;
  newFile?: Blob;
  newSize?: number;
  newWidth?: number;
  newHeight?: number;
  quality = 75;
  scale: ScaleOption = {
    type: "percent",
    percent: 100,
  };

  constructor(public source: ImageSource, option?: CompressOption) {
    // Compression quality options
    let quality: number | undefined = option?.quality;
    if (typeof quality === "number") {
      if (quality < 0) quality = 0;
      if (quality > 100) quality = 100;
      this.quality = quality;
    }
    // Zoom Options
    let scale: ScaleOption | undefined = option?.scale;
    if (typeof scale === "object") {
      this.scale = { ...this.scale, ...scale };
      if (this.scale.type === "percent") {
        if (!this.scale.percent || this.scale.percent > 100)
          this.scale.percent = 100;
        if (this.scale.percent < 0) this.scale.percent = 0;
      }
    }
  }

  /**
   * Get the Blob of the image according to the image link
   * @param imgUrl
   * @returns
   */
  async fetchBlob(imgUrl: string) {
    const result = await fetch(imgUrl);
    return result.blob();
  }

  /**
   * Update the original information of the image
   */
  private async createImageFromSource() {
    if (this.source instanceof Blob) {
      this.file = this.source;
    } else if (this.source instanceof HTMLImageElement) {
      this.file = await this.fetchBlob(this.source.src);
    } else if (typeof this.source === "string") {
      this.file = await this.fetchBlob(this.source);
    } else {
      throw new Error(
        `The image source is illegal and must be type of: HTMLImageElement | Blob | string`
      );
    }

    this.type = this.file.type.toLowerCase() as ImageMime;
    this.size = this.file.size;
    if (!isTypeSupport(this.type)) {
      throw new Error(`Current image format is not supported`);
    }

    // Now read the information of the original image
    this.image = await new Promise((resolve) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(this.file!);
      img.onload = () => resolve(img);
    });
    this.width = this.image.width;
    this.height = this.image.height;
  }

  /**
   * Get new dimensions based on scaling parameters
   * @returns
   */
  private getNewDimension() {
    // SVG image file cannot be scaled
    if (this.type === ImageMime.SVG) {
      this.newWidth = this.width;
      this.newHeight = this.height;
      return;
    }

    // Get the final new width and height according to the parameters
    let newWidth = this.width;
    let newHeight = this.height;
    // Scaling to scale
    if (this.scale.type === "percent") {
      const scale = Number(this.scale.percent);
      newWidth = Math.round((this.width! * scale) / 100);
      newHeight = Math.round((this.height! * scale) / 100);
    }
    // Zoom to width
    if (this.scale.type === "width") {
      const toWidth = Number(this.scale.width);
      if (toWidth && toWidth > 0) {
        newWidth = toWidth;
        newHeight = Math.round((toWidth * this.height!) / this.width!);
      }
    }
    // Zoom to height
    if (this.scale.type === "height") {
      const toHeight = Number(this.scale.height);
      if (toHeight && toHeight > 0) {
        newWidth = Math.round((toHeight * this.width!) / this.height!);
        newHeight = toHeight;
      }
    }
    this.newWidth = newWidth;
    this.newHeight = newHeight;
  }

  /**
   * Draw the current image into the canvas context
   * @returns
   */
  private drawToCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = this.newWidth!;
    canvas.height = this.newHeight!;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.drawImage(
      this.image!,
      0,
      0,
      this.width!,
      this.height!,
      0,
      0,
      this.newWidth!,
      this.newHeight!
    );
    return { canvas, context };
  }

  /**
   * Compresse SVG
   */
  private async compressSVG() {
    // Read the contents of an svg file
    let content: string;
    if (typeof this.file!.text === "function") {
      content = await this.file!.text();
    } else {
      content = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          resolve(reader.result as string);
        });
        reader.readAsText(this.file!);
      });
    }

    const result = svgo.optimize(content, {
      plugins: [
        {
          name: "removeViewBox",
          active: false,
        },
        {
          name: "removeDimensions",
          active: true,
        },
      ],
    });
    const blob = new Blob([result.data], { type: this.type });
    this.newFile = blob;
    this.newSize = blob.size;
  }

  /**
   * Compression through canvas JPG/JPEG/WEBP
   */
  private async compressByCanvas() {
    const { canvas } = this.drawToCanvas();
    const blob = (await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, this.type, this.quality / 100);
    })) as Blob;
    this.newFile = blob;
    this.newSize = blob.size;
  }

  /**
   * Compress PNG
   */
  async compressPNG() {
    const { context } = this.drawToCanvas();
    const imageData = context.getImageData(
      0,
      0,
      this.newWidth!,
      this.newHeight!
    );
    const buffer = imageData.data.buffer;
    const png = UPNG.encode(
      [buffer],
      this.newWidth,
      this.newHeight,
      (256 * this.quality) / 100
    );
    const blob = new Blob([png], { type: this.type });
    this.newFile = blob;
    this.newSize = blob.size;
  }

  /**
   * Perform compression
   */
  async run() {
    await this.createImageFromSource();
    this.getNewDimension();
    // Performs different compressions depending on the image type
    const canvasTypeList: string[] = [
      ImageMime.JPG,
      ImageMime.JPEG,
      ImageMime.WEBP,
    ];
    if (canvasTypeList.includes(this.type!)) {
      await this.compressByCanvas();
    } else if (this.type === ImageMime.PNG) {
      await this.compressPNG();
    } else if (this.type === ImageMime.SVG) {
      await this.compressSVG();
    }
  }

  /**
   * Downloading the compressed file must be called after the run operation
   */
  download(name?: string) {
    if (this.newFile instanceof Blob) {
      const link = document.createElement("a");
      let dlname = "download";
      if (name && typeof name === "string") {
        dlname = name;
      }
      dlname += "." + getExtensionByType(this.type!);
      link.download = dlname;
      link.href = URL.createObjectURL(this.newFile);
      link.click();
      link.remove();
    }
  }
}

/**
 * Convenient compression functions
 * @param source
 * @param option
 * @returns
 */
export async function compress(source: ImageSource, option?: CompressOption) {
  const txxc = new TxxCompress(source, option);
  await txxc.run();
  return txxc;
}

/**
 * Compress and download, a download box will pop up
 * @param source 
 * @param option 
 * @param dlname 
 * @returns 
 */
export async function compressAndDownload(
  source: ImageSource,
  option?: CompressOption,
  dlname?: string
) {
  const txxc = await compress(source, option);
  txxc.download(dlname);
  return txxc;
}
