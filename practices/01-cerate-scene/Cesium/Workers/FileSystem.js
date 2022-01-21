//提取等值线线程
if (typeof self === 'undefined') {
    self = {}; //define self so that the Dojo build can evaluate this file without crashing.
}
if (typeof window === 'undefined') {
    window = self;
}

define(['./createTaskProcessorWorker'], function (createTaskProcessorWorker) {

    self.importScripts('../Cesium.js');


    if (typeof File == 'undefined') {
        File = {};
    }
    /**
    *
    *@param {File|Blob}fileOrBlob
    *@return {Promise.<ArrayBuffer>}
    */
    File.readAsArrayBuffer = function (file) {
        var promise = Cesium.when.defer();
        var fr = new FileReader();
        fr.onload = function (e) {
            promise.resolve(e.target.result);
        }
        fr.onprogress = function (e) {
            if (promise.progress)
                promise.progress(e.target.result);
        }
        fr.onerror = function (e) {
            promise.reject(e.error);
        }
        fr.readAsArrayBuffer(file);
        return promise;;
    }

    /**
          *
          *@param {File|Blob}fileOrBlob
          *@return {Promise.<Uint8Array>}
          */
    File.readAllBytes = function (file) {
        var promise = Cesium.when.defer();
        var fr = new FileReader();
        fr.onload = function (e) {
            promise.resolve(new Uint8Array(e.target.result));
        }
        fr.onprogress = function (e) {
            if (promise.progress)
                promise.progress(e.target.result);
        }
        fr.onerror = function (e) {
            promise.reject(e.error);
        }
        fr.readAsArrayBuffer(file);
        return promise;;
    }

    /**
         * @param {Object}options
         * @constructor
         * @memberof MeteoLib.Util
         */
    function Stretcher(options) {
        this.options = options;
    }

    /**
     * 
     * @param {ArrayLike}array
     * @return {Uint8ClampedArray}
     */
    Stretcher.stretch = function (array, validRange) {
        var grayValues = new Uint8ClampedArray(array.length);
        var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, delt;
        if (validRange) {
            min = validRange[0];
            max = validRange[1];
        } else {
            for (var i = 0; i < array.length; i++) {
                if (isNaN(array[i])) continue;
                min = Math.min(array[i], min);
                max = Math.max(array[i], max);
            }
        }

        delt = max - min;
        for (var i = 0; i < array.length; i++) {
            var val = ((array[i] - min) / delt) * 255;
            if (val > 255) val = 255;
            if (val < 0) val = 0;
            grayValues[i] = val;
        }
        return grayValues;
    }

    var FileSystem = {};

    /**
     *使用读取栅格数据的方式读取文件数据
    * @param {File|Blob}fileInfo 文件信息
    * @param {Number} xOffset 列偏移量
    * @param {Number} yOffset 行偏移量
    * @param {Number} xSize 将读取原始栅格数据的列数（宽度）
    * @param {Number} ySize 将读取原始栅格数据的行数（高度）
    * @param {Number} [typeSize=0] 每个像素数据占用的字节数
    * @param {Number} xBufferSize 读取数据后存放的缓冲区列数
    * @param {Number} yBufferSize 读取数据后存放的缓冲区行数
    * @param {Number} stride 原始栅格数据宽度
    * @param {Array.<Number>} [bandOffsets] 读取多个波段时需要单独设置各个波段的起始位置（该波段第一个字节的位置相对于整个文件开头的字节数）
    * @param {Boolean} [flipY=false] true则图像上下翻转，默认为false
    * @param {Number} [numberOfY=0] 原始栅格数据高度（行数）
    * @param {Number} [headerSize=0] 文件头占用字节数，读取时将跳过此数据块。可选，默认为0
    * @returns {Promise.<ArrayBuffer>}  
    */
    FileSystem.readRasterData = function (
        fileInfo, xOffset, yOffset, xSize, ySize,
        stride, typeSize, xBufferSize, yBufferSize, bandOffsets, flipY, numberOfY,
        headerSize) {

        headerSize = headerSize ? headerSize : 0;


        xOffset = parseInt(xOffset),
            yOffset = parseInt(yOffset),
            xSize = parseInt(xSize),
            ySize = parseInt(ySize),
            xBufferSize = parseInt(xBufferSize),
            yBufferSize = parseInt(yBufferSize),
            numberOfY = parseInt(numberOfY),
            flipY = flipY && numberOfY;

        typeSize = parseInt(typeSize);
        stride = parseInt(stride);
        if (headerSize) {
            headerSize = parseInt(headerSize);
        }

        if (!bandOffsets || !bandOffsets.length) {
            bandOffsets = [headerSize]
        }

        var bandCount = bandOffsets.length;
        var bufStride = xBufferSize;
        var bufByteLength = xBufferSize * yBufferSize * typeSize;

        //var fd = fs.openSync(realPath, 'r+');
        var promise = Cesium.when.defer();
        try {
            var blobArr = [];
            var xScale = xSize / xBufferSize;
            var yScale = ySize / yBufferSize;

            if (xScale == 1 && yScale == 1) {
                for (var bandNo = 0; bandNo < bandCount; bandNo++) {
                    var y;

                    for (var i = 0; i < ySize; i++) {
                        y = i;
                        if (flipY) y = numberOfY - y - 1;
                        //var offset = y * bufStride * typeSize + bandNo * bufByteLength;
                        var position = (y + yOffset) * stride + xOffset;
                        position *= typeSize;
                        position += bandOffsets[bandNo];

                        blobArr.push(fileInfo.slice(position, position + bufStride * typeSize));
                        // fs.readSync(fd, buf, offset, bufStride*typeSize, position);
                    }
                }
                blobArr = new Blob(blobArr);
                return File.readAsArrayBuffer(blobArr);

            } else {//重采样，缩放
                var buf = new Uint8Array(bufByteLength * bandCount);
                var tempBufferLength = xSize * typeSize;//new Buffer(xSize * typeSize);

                function readNextBand(bandNo) {

                    if (bandNo >= bandCount) {
                        promise.resolve(buf.buffer);
                        return;
                    }
                    var idx = 0;
                    var y;

                    var offset = bandNo * bufByteLength;

                    function readNextLine(i) {
                        if (i >= yBufferSize) {
                            readNextBand(bandNo + 1);
                            return;
                        }
                        y = parseInt(i * yScale);
                        var position = (y + yOffset) * stride + xOffset;
                        if (flipY)
                            position = (numberOfY - 1 - (y + yOffset)) * stride + xOffset;
                        position *= typeSize;
                        position += bandOffsets[bandNo];

                        //fs.readSync(fd, temoBuffer, 0, temoBuffer.length, position);

                        var partBlob = fileInfo.slice(position, position + tempBufferLength);
                        File.readAllBytes(partBlob).then(function (tempBuffer) {

                            for (var j = 0; j < xBufferSize; j++) {
                                var x = parseInt(j * xScale) * typeSize;
                                for (var index = 0; index < typeSize; index++) {
                                    buf[offset + idx++] = tempBuffer[x + index];
                                }
                            }
                            readNextLine(i + 1);
                        }).otherwise(function (reason) {
                            buf = null;
                            promise.reject(reason);
                        })
                    }
                    readNextLine(0);
                }
                readNextBand(0);
            }

        } catch (e) {
            promise.reject(e);
        }
        return promise;
    }


    function FileSystemFunc(packedParameters, transferableObjects) {
        var result = FileSystem[packedParameters.methodName].apply(this, packedParameters.args);
        return result;
    }

    return createTaskProcessorWorker(FileSystemFunc);
})
