/*!
 * processImg.js
 * @version 1.0
 * @author 流水行舟
 *
 * 这是一个基于canvas，应用在移动端的前端图片压缩的JS，其修正了上传时图片倒转等问题。
 * Date: 2014-07-02
 */
import { Exif } from './exif';
export class CompressImg {
    private exif: Exif;

    private value: any;

    public imgSrc: any;

    constructor(file: File | Blob, afterWidth, callback) {
        this.exif = new Exif();
        let hidCanvas = document.createElement('canvas');

        //生成隐藏画布
        if (hidCanvas.getContext) {
            var hidCtx = hidCanvas.getContext('2d');
        } else {
            alert("对不起，您的浏览器不支持图片压缩及上传功能，请换个浏览器试试~");
        }

        //通过 this.files 取到 FileList ，这里只有一个
        var self = this,
            p = new Image(),
            reader = new FileReader();
        reader.onload = function (evt: any) {
            var srcString = evt.target.result;

            //安卓获取的base64数据无信息头，加之
            if (srcString.substring(5, 10) != "image") {
                p.src = srcString.replace(/(.{5})/, "$1image/jpeg;");
            } else {
                p.src = srcString;
            }

            p.onload = function () {

                var upImgWidth = p.width,
                    upImgHeight = p.height;
                var orientation = 1;
                //获取图像的方位信息
                self.exif.getData(p, function () {
                    orientation = parseInt(self.exif.getTag(p, "Orientation"));
                    orientation = orientation ? orientation : 1;
                });
                //压缩换算后的图片高度
                let afterHeight: any = afterWidth * upImgHeight / upImgWidth;
                if (upImgWidth < 10 || upImgWidth < 10) {
                    alert("请不要上传过小的图片");
                    self.imgSrc = '';
                    self.value = "";
                    return false;
                } else {

                    if (orientation <= 4) {
                        // 设置压缩canvas区域高度及宽度
                        hidCanvas.setAttribute("height", afterHeight);
                        hidCanvas.setAttribute("width", afterWidth);
                        if (orientation == 3 || orientation == 4) {
                            hidCtx.translate(afterWidth, afterHeight);
                            hidCtx.rotate(180 * Math.PI / 180);
                        }
                    } else {
                        // 设置压缩canvas区域高度及宽度
                        hidCanvas.setAttribute("height", afterWidth);
                        hidCanvas.setAttribute("width", afterHeight);

                        if (orientation == 5 || orientation == 6) {
                            hidCtx.translate(afterHeight, 0);
                            hidCtx.rotate(90 * Math.PI / 180);
                        } else if (orientation == 7 || orientation == 8) {
                            hidCtx.translate(0, afterWidth);
                            hidCtx.rotate(270 * Math.PI / 180);
                        }
                    }

                    // canvas绘制压缩后图片
                    self.drawImageIOSFix(hidCtx, p, 0, 0, upImgWidth, upImgHeight, 0, 0, afterWidth, afterHeight);
                    // 获取压缩后生成的img对象
                    self.imgSrc = self.convertCanvasToImage(hidCanvas);
                    self.value = "";
                    // 此处将得到的图片数据回调
                    if (callback != undefined) { callback(self.imgSrc) };
                }
            }
        }
        reader.readAsDataURL(file);
    }
    //canvas转图像
    public convertCanvasToImage(canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/jpeg");
        return image;
    }


    /**
	 * 以下代码是修复canvas在ios中显示压缩的问题。
	 * Detecting vertical squash in loaded image.
	 * Fixes a bug which squash image vertically while drawing into canvas for some images.
	 * This is a bug in iOS6 devices. This function from https://github.com/stomita/ios-imagefile-megapixel
	 *
	 */
    public detectVerticalSquash(img) {
        var iw = img.naturalWidth, ih = img.naturalHeight;
        var canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = ih;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, 1, ih).data;
        // search image edge pixel position in case it is squashed vertically.
        var sy = 0;
        var ey = ih;
        var py = ih;
        while (py > sy) {
            var alpha = data[(py - 1) * 4 + 3];
            if (alpha === 0) {
                ey = py;
            } else {
                sy = py;
            }
            py = (ey + sy) >> 1;
        }
        var ratio = (py / ih);
        return (ratio === 0) ? 1 : ratio;
    }


    /**
	 * A replacement for context.drawImage
	 * (args are for source and destination).
	 */
    public drawImageIOSFix(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        var vertSquashRatio = this.detectVerticalSquash(img);
        // Works only if whole image is displayed:
        // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
        // The following works correct also when only a part of the image is displayed:
        ctx.drawImage(img, sx * vertSquashRatio, sy * vertSquashRatio,
            sw * vertSquashRatio, sh * vertSquashRatio,
            dx, dy, dw, dh);
    }
}