// 默认看向中国
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(90,-20,110,90)


// 定义场景、标签位置数组、实体数组
let viewer,labelArr = [],entities = []

// 创建地球
viewer = new Cesium.Viewer('cesiumContainer')

// 默认的显示地球纹理
viewer.baseLayerPicker.viewModel.selectedImagery= viewer.baseLayerPicker.viewModel.imageryProviderViewModels[3];

// 添加显示层级网格线
viewer.imageryLayers.addImageryProvider(new Cesium.TileCoordinatesImageryProvider())

viewer.scene.globe.preloadAncestors = false

// 关闭鼠标操作惯性
var CesiumViewerSceneController = viewer.scene.screenSpaceCameraController;
CesiumViewerSceneController.inertiaSpin = 0;
CesiumViewerSceneController.inertiaTranslate = 0;
CesiumViewerSceneController.inertiaZoom = 0;

// 加载json文件
fetch('./AANP自然地名.geojson').then((res)=>{

    return res.json()

})
.then(json=>{
    for(const item of json.features){

        // 取出数据中各区域的位置
        let obj = [item.geometry.coordinates[0],item.geometry.coordinates[1]]
        labelArr.push(obj)

        // 创建实体
        let entity = new Cesium.Entity({

            position:new Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0],item.geometry.coordinates[1]),
            
            label:{

                text:item.properties.NAME,
                fillColor:Cesium.Color.fromCssColorString ('red'),
                font:'20pt monospace',
                heightReference:Cesium.CLAMP_TO_GROUND

            }

        })

        // 使用数组保存实体，方便后续检索删除
        entities.push(entity)

    }

    console.log(entities.length)

    // 获取当前正在渲染的瓦片集合
    const tilesToRender =viewer.scene.globe._surface._tilesToRender

    /**
     * 添加相机移动结束事件，也就是鼠标移动结束事件
     * 由于相机自身有惯性，所以提前关闭惯性会有更好的体验
     * 但是这本身并不影响该功能
     * */
    viewer.camera.moveEnd.addEventListener(()=>{

        // 当前正在渲染的瓦片求并集为一个大的rectangle
        let renderRectangle = new Cesium.Rectangle()
        
        if( tilesToRender.length > 0 ) {

            // 初始化总的渲染的矩形瓦片
            Cesium.Rectangle.clone(tilesToRender[0].rectangle,renderRectangle)

            let num = 0

            tilesToRender.forEach(item => {

                /**
                 * 获取当前层级大于等于12级的瓦片，该处可自定，具体层级可根据加载的实体多少决定
                 * 一般情况下由于相机视角的不同，我们能看见的瓦片数量也不同，所以尽量考虑瓦片数量
                 * 最多的情况下每块瓦片上的显示数量
                */
                if( item.level >= 12 ) {

                    // 用来判断当前是否有符合条件的瓦片正在渲染
                    num += 1

                    // 所有大于12级的瓦片求交集
                    Cesium.Rectangle.union(item.rectangle, renderRectangle, renderRectangle)

                }

            })

            if( num > 0 ){

                // 判断点是否在所需渲染的瓦片内
                for( let i = 0; i < entities.length; i++ ) {

                    // 将度转为弧度
                    let cartographic = Cesium.Cartographic.fromDegrees(labelArr[i][0], labelArr[i][1])

                    // 判断点是否在矩形内
                    if(Cesium.Rectangle.contains(renderRectangle,cartographic)){

                        // 判断当前实体是否已经被加载，有则跳过，无则加载
                        if(viewer.entities.contains(entities[i])) continue

                        viewer.entities.add(entities[i])

                    } else {

                        // 不在点内，则判断是否被加载，有则删除
                        if(viewer.entities.contains(entities[i])){

                            viewer.entities.remove(entities[i])

                        }

                    }

                }

            } else{

                for( let i = 0; i < entities.length; i++ ){

                    /**
                     *  当前可视范围内没有符合条件的瓦片加载，删除掉所欲瓦片
                     * 不能使用removeAll,我们只需要管理我们自己加载的部分即可
                    */
                    if(viewer.entities.contains(entities[i])){

                        viewer.entities.remove(entities[i])

                    }

                }

            }
        }
    })
})