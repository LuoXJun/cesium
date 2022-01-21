//插值线程
if (typeof self === 'undefined') {
    self = {}; //define self so that the Dojo build can evaluate this file without crashing.
}
if (typeof window === 'undefined') {
    window = self;
}

define(['./createTaskProcessorWorker'], function (createTaskProcessorWorker) {

    self.importScripts('../Cesium.js');

    function processTerrainData(terrainData, tile) {

        var resX = tile.resX,
            resY = tile.resY;
        var index = 0;
        var terrainBuffer = new Float32Array(tile.tileWidth * tile.tileHeight);
        for (var i = 0; i < tile.tileHeight; i++) {
            var lat = resY * i + tile.rectangle.north;

            for (var j = 0; j < tile.tileWidth; j++) {
                var lon = resX * j + tile.rectangle.west;

                var height = terrainData.interpolateHeight(tile.rectangle, lon, lat);
                if (!height) {
                    height = 0;
                }
                terrainBuffer[index++] = height;
            }
        }
        return terrainBuffer;
    }

    function terrainDataProcessorFunc(packedParameters, transferableObjects) {
        var result = processTerrainData.apply(this, packedParameters.args);
        return result;
    }
    return createTaskProcessorWorker(terrainDataProcessorFunc);
})
