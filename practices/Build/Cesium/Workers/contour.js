//提取等值线线程
if (typeof self === 'undefined') {
    self = {};
}
if (typeof window === 'undefined') {
    window = self;
}

define(['./createTaskProcessorWorker'], function (createTaskProcessorWorker) {
    self.importScripts('./d3-contour.js');
    var Contour = {};

    Contour.extractContour = function (data, width, height, breaks) {
        for (var i = 0; i < breaks.length; i++) {
            breaks[i] = parseFloat(breaks[i])
        }
        //提取等值线
        var contours = d3.contours()
            .size([width, height])
            .thresholds(breaks)
            (data);
        return contours
    }

    function contourFunc(packedParameters, transferableObjects) {
        var result = Contour[packedParameters.methodName].apply(this, packedParameters.args);
        return result;
    }

    return createTaskProcessorWorker(contourFunc);

})
