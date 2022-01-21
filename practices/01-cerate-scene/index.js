// 初始化变量
let viewer
;(function (){
    // 也可以通过css样式达到显示隐藏的效果
    viewer = new Cesium.Viewer('cesiumContainer', {
    // 界面UI功能隐藏设置，方法一通过JS控制，方法二通过CSS控制
    // 查找位置工具
    geocoder: true,
    // 视角返回初始位置
    homeButton: true,
    // 选择视角模式，包括3D，2D，哥伦布视图（CV）
    sceneModePicker: true,
    // 图层选择器，选择要显示的地图服务和地形服务
    baseLayerPicker: true,
    // creditContainer 包含的DOM元素或ID CreditDisplay。如果未指定，则将积分添加到窗口小部件的底部。版权信息位置，不设置默认显示在时间条上面位置
    // creditContainer: "div id名",
    // 导航帮助按钮，显示默认的地图控制帮助
    navigationHelpButton: true,
    // 左下角动画插件隐藏
    animation: true,
    // 时间线，指示当前时间，并允许用户跳到特定时间
    timeline: true,
    // 全屏按钮
    fullscreenButton: true,
    // vr按钮
    vrButton: true,
    });
    //   选择默认地图
    viewer.baseLayerPicker.viewModel.selectedImagery= viewer.baseLayerPicker.viewModel.imageryProviderViewModels[15];
    // 显示1帧速
    viewer.scene.debugShowFramesPerSecond = true;
})()

// 创建实体entity加入到场景中
;(function (){
    // 创建蓝色椭圆体
    let blueEllipse = viewer.entities.add({
        // 经纬度转世界坐标
        position: Cesium.Cartesian3.fromDegrees(-95.0, 40.0, 100000.0),
        name : 'Blue translucent, rotated, and extruded ellipse with outline',
        ellipse : {
            // 短半轴
            semiMinorAxis : 150000.0,
            // 长半轴
            semiMajorAxis : 300000.0,
            // 拉伸高度====平面变立体
            extrudedHeight : 100000.0,
            rotation : Cesium.Math.toRadians(45),
            material : Cesium.Color.BLUE.withAlpha(0.5),
            outline : true
        }
    });
    // 创建立方体
    // let cube = viewer.entities.add({
    //     position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
    //     name:'cube',
    //     box:{
    //         dimensions:new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
    //         outline:true,
    //         material: Cesium.Color.GREEN.withAlpha(0.5),
    //         outlineColor: Cesium.Color.YELLOW
    //         // fill:false
    //     }
    // })
    viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
        name:'cube',
        billboard:{
            image:'./pos.png'
        }
    })
    
    // 自定义管道图案
    let polyline = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(-105.0, 42.0, 300000.0),
        // 声明一个立方体盒子
        polylineVolume: {
            // 定Cartesian3定义线条的位置数组。
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([-95.0, 32.0, 0.0, -95.0, 36.0, 100000.0, -99.0, 36.0, 200000.0]),
            // shape 指定Cartesian2定义要挤出的形状的位置数组。
            shape: computeStar(4, 50000, 50000),
            fill:false,
            outline:true,
            // cornerType 指定拐角样式的属性。
            // cornerType: Cesium.CornerType.MITERED,
            // material 指定用于填充卷的材料。
            // material: Cesium.Color.BLUE
        }
    })
    function computeStar(arms, rOuter, rInner) {
        var angle = Math.PI / arms;
        var length = 2 * arms;
        var positions = new Array(length);
        for (var i = 0; i < length; i++) {
            var r = (i % 2) === 0 ? rOuter : rInner;
            positions[i] = new Cesium.Cartesian2(Math.cos(i * angle) * r, Math.sin(i * angle) * r);
        }
        console.log(positions)
        return positions;
    }

    // 通过czml加载数据
    var czml = [{
        "id": "document",
        "name": "box",
        "version": "1.0"
    }, {
        "id": "shape2",
        "name": "Red box with black outline",
        "position": {
            "cartographicDegrees": [-106.0, 41.0, 300000.0]
        },
        "box": {
            "dimensions": {
                "cartesian": [40000.0, 30000.0, 50000.0]
            },
            "material": {
                "solidColor": {
                    "color": {
                        "rgba": [255, 255, 0, 128]
                    }
                }
            },
            "outline": true,
            "outlineColor": {
                "rgba": [0, 0, 0, 255]
            }
        }
    }];

    // 也可以直接加载czml文件===文件路径不存在
    // viewer.dataSources.add(Cesium.CzmlDataSource.load("../SampleData/simple.czml"))
    viewer.dataSources.add(Cesium.CzmlDataSource.load(czml))
    viewer.zoomTo(Cesium.CzmlDataSource.load(czml));
})();