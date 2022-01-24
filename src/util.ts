import { ImageMime } from "./const";

/**
 * 判断webp格式是否支持
 * @returns boolean
 */
export function isWebpSupport() {
  const canvas = document.createElement("canvas");
  const mimeWebp = ImageMime.WEBP;
  return canvas.toDataURL(mimeWebp).indexOf(`data:${mimeWebp}`) === 0;
}

/**
 * 检测某个类型的图片是否支持
 * @param type
 */
export function isTypeSupport(type: string) {
  type = type.toLowerCase();
  if (type === ImageMime.WEBP) {
    return isWebpSupport();
  }
  const list: string[] = [
    ImageMime.JPG,
    ImageMime.JPEG,
    ImageMime.SVG,
    ImageMime.PNG,
  ];
  return list.includes(type);
}

/**
 * 根据类型获取后缀
 * @param type 
 * @returns 
 */
export function getExtensionByType(type: string) {
  const list = {
    [ImageMime.JPG]: "jpg",
    [ImageMime.JPEG]: "jpeg",
    [ImageMime.SVG]: "svg",
    [ImageMime.PNG]: "png",
    [ImageMime.WEBP]: "webp",
  };
  return list[type as ImageMime];
}
