// 当前允许处理的图片类型
export enum ImageMime {
  JPG = "image/jpeg",
  JPEG = "image/jpeg",
  SVG = "image/svg+xml",
  PNG = "image/png",
  // webp格式可能在不同浏览器有兼容问题，要单独检测
  WEBP = "image/webp",
}
