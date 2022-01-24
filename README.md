# txx-compress

This is a purely browser-side implementation of an image compression library that supports compression of multiple image formats. The current compression library relies on the following third-party libraries.

- [svgo](https://github.com/svg/svgo) For compressing `image/svg+xml` format images
- [UPNG.js](https://github.com/photopea/UPNG.js) For compressing `image/png` format images

## The following image formats are supported for compression:

- `image/jpeg`
- `image/jpeg`
- `image/svg+xml`
- `image/png`
- `image/webp`

> For `WEBP` format compression, the current library depends on whether the browser supports the `WEBP` image format

## Installation

```bash
npm install txx-compress
```

## usage

The simplest form is directly through function calls：

```js
// import library
import { compress } from "txx-compress";
// file can be: `File` object | `HTMLImageElement` instance | URL of the image
await compress(file);
```

It can also be called by creating a compression instance, Please note the calling order：

```js
import { TxxCompress } from "txx-compress";
// step1
const txxc = new TxxCompress(file, { quality: 50 });
// step2
await txxc.run();
// step3: Suffixes are automatically added
txxc.download("My Download");
```

## API

Declaration of related types

```js
interface ScaleOption {
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

interface CompressOption {
  // Compression mass 1-100, the higher the mass the larger the size
  quality?: number;
  scale?: ScaleOption;
}

type ImageSource = Blob | File | HTMLImageElement | string;
```

Function Call Signatures：

```js
/**
 * Convenient compression functions
 * @param source ImageSource
 * @param option CompressOption
 * @returns
 */
function compress(source: ImageSource, option?: CompressOption): Promise<TxxCompress>;

/**
 * Compress and download, a download box will pop up
 * @param source ImageSource
 * @param option CompressOption
 * @param dlname download file name
 * @returns
 */
function compressAndDownload(source: ImageSource, option?: CompressOption, dlname?: string): Promise<TxxCompress>;

```

Class Signature：

```js
interface TxxCompress {
  /**
   * Constructors 
   */
  new(source: ImageSource, option?: CompressOption): TxxCompress;
  /**
   * Perform compression
   */
  run(): Promise<void>;
  /**
   * Downloading the compressed file must be called after the run operation
   */
  download(name?: string): void;
}
```
