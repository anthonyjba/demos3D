var controls;
var scene, camera, renderer;


function loadParcela3D() {
   
    var width = 1000; //window.innerWidth,
    height = 1000; //window.innerHeight,
        //referencia = "33007A05000254",
        //referencia = "33900A04300163",
        //referencia = "46007A00600077",
        referencia = "27034A04600475",
        //Url = 'http://localhost:50919/PotencialAgrologicoServicio.svc/ObtenerDatos3D?referencia=' + referencia;
        //Url = 'http://10.57.224.242/Servicios/PotencialAgrologicoServicio.svc/ObtenerDatos3D?referencia=' + referencia;
        Url = 'data/data5m/coord_27034A04600475.txt';

        var center = new THREE.Vector3(0, 0, 0);

        

    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xeeeeee));

    var boundingBox = new THREE.Box3().setFromObject(scene);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, -500, 500);
   // camera.lookAt(0, 0, 0);



    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    //renderer.setClearColor(0, 0);
    //renderer.setClearColor(new THREE.Color().setStyle('lightskyblue').getHex());
    renderer.autoClear = true;


    //var canvas = document.createElement("canvas");
    //canvas.width = width;
    //canvas.height = height;

    //var ctx = canvas.getContext("2d");
    //// render "sky-like" background
    //var grad = ctx.createLinearGradient(0, 0, 0, height);
    //grad.addColorStop(0, "#98c8f6");
    //grad.addColorStop(0.4, "#cbebff");
    //grad.addColorStop(1, "#f0f9ff");
    //ctx.fillStyle = grad;
    //ctx.fillRect(0, 0, width, height);

    //renderer.shadowMapEnabled = true;
    //renderer.shadowMapSoft = true;

    
    var terrainLoader = new THREE.WcsTerrainLoader();
    //terrainLoader.jsonp = true;
    terrainLoader.jsonpCallback = 'jsonpCallback';
    terrainLoader.load(Url, jsonpCallback);
    
    controls = new THREE.TrackballControls(camera);

    document.getElementById('webgl').appendChild(renderer.domElement);

    render();
}

function render() {
    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

function jsonpCallback(data) {
    //var bbox = '725000,4362475,725225,4362800'; //93600,4817800,94800,4819000
    //665895.73, 4757811.3, 666272.78, 4758306.55  665525,4757325,667025,4759300
    var Polygon, bboxArea3D, srid = 25829;

    bboxArea3D = [665525, 4757325, 667025, 4759300];

    if (typeof data === "string") {
        var arrData = data.split("\n");

        Polygon = arrData[0].split(',');
        bboxArea3D = arrData[1].split(',').map(function (p) { return parseFloat(p) });
        srid = arrData[2];
        arrData.shift(); arrData.shift(); arrData.shift();

        data = arrData.map(function (value) {
            return parseFloat(value.split(' ')[2]);
        })
    }
    
    /** Cálculo de parámetros ***/
    var x1, x2, y1, y2;
    y1 = bboxArea3D[1];
    y2 = bboxArea3D[3];
    x1 = bboxArea3D[0];
    x2 = bboxArea3D[2];


    var distance = 25,
  
        anchoArea3D = x2 - x1, // xMax - xMin
        altoArea3D = y2 - y1, // yMax - yMin
        widthSeg = (anchoArea3D) / distance,
        heightSeg = (altoArea3D) / distance,
        divisor = (anchoArea3D / (widthSeg*10))/1; //widthSeg * 10; //12 = (1200 / 100) (100: ancho del primer parametro PlaneGeometry)

        

    //La distancia de la imagen total es de 1200 metros (x,y)
    //Para el 3 y 4 parametro la distancia es entre 25 metros del raster: Ejemplo (1200 / 25) = 48

    data.pop();

    //var geometry = new THREE.PlaneGeometry(heightSeg * 10, widthSeg * 10, heightSeg, widthSeg); //(90, 130, 9, 13)
    var geometry = new THREE.PlaneGeometry(widthSeg * 10, heightSeg * 10, widthSeg, heightSeg); //(90, 130, 9, 13)

    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
        geometry.vertices[i].z = data[i] / divisor; 
    }

    //var wmsUrl = 'http://www.mapabase.es/arcgis/rest/services/Raster/MapaBase_o_ETRS89_30N/MapServer/export?F=image&FORMAT=PNG32&TRANSPARENT=true&SIZE=' + (widthSeg * 100) + '%2C' + (heightSeg * 100) + '&BBOX=' + bboxArea3D.join('%2C') + '&BBOXSR=' + srid + '&IMAGESR=' + srid + '&DPI=90';
    var wmsUrl = 'data/data5m/27034A04600475.png';
    var urlPolygon = 'data/data5m/27034A04600475.png';

    THREE.ImageUtils.crossOrigin = 'anonymous';

    var group = new THREE.Group();
    scene.add(group);

    var loader = new THREE.TextureLoader();
    loader.load(
	    // resource URL
	    wmsUrl,
	    // Function when resource is loaded
	    function (texture) {
	        // do something with the texture
	        var material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 1 });
	        var mesh = new THREE.Mesh(geometry, material);
	        group.add(mesh);
	    },
	    // Function called when download progresses
	    function (xhr) {
	        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	    },
	    // Function called when download errors
	    function (xhr) {
	        console.log('An error happened');
	    }
    );


    ///* DRAW POLYGON*/
    //var geom3;
    ////var material;
    //var parcela = {};
    //var height = 10;
    
    //Polygon = "666084.23 4757811.3,666186.64 4757816.64,666255.53 4757820.24,666256.23 4757841.86,666261.25 4757863.35,666262.21 4757865.73,666266.29 4757875.89,666272.78 4757887.64,666248.51 4757897.41,666235.4 4757892,666230.4 4757892.65,666219.28 4757900.92,666206.47 4757917.51,666200.5 4757925.73,666197.78 4757930.36,666194.2 4757937.37,666192.13 4757943.69,666189.5 4757949.97,666180.4 4757949.28,666174.21 4757950.78,666174.37 4757953.61,666180.24 4757959.15,666179.03 4757959.23,666157.13 4757986.27,666145.67 4757998.58,666140.16 4758009.08,666126.35 4758051.74,666118.88 4758060.16,666104.04 4758070.4,666091.46 4758084.32,666084.3 4758095.27,666081.58 4758104.83,666081.33 4758117.92,666083.1 4758126.03,666087.72 4758133.59,666113.4 4758151.47,666128.3 4758162.06,666132.9 4758167.15,666136.48 4758171.47,666136.46 4758173.28,666133.29 4758175.8,666092.05 4758188.58,666088.51 4758191.77,666087.17 4758195.65,666087.44 4758200.13,666092.45 4758221.77,666094.19 4758234.83,666084.21 4758237.01,666075.72 4758242.09,666070.95 4758248.07,666068.91 4758252.55,666066.9 4758263.25,666061.7 4758264.1,666057.02 4758267.04,666045.97 4758282.13,666019.47 4758289.77,666012.19 4758295.84,666005.83 4758304.06,666001.39 4758306.55,665998.44 4758302.62,665995.57 4758293.77,665992.15 4758287.45,665967.67 4758257.41,665961.36 4758251.69,665952.2 4758246.13,665950.84 4758241.9,665952.88 4758237.77,665970.46 4758227.95,665982.56 4758215.2,666002.13 4758203.09,666009.2 4758196.11,666033.25 4758164.64,666051.05 4758149.9,666063.63 4758142.22,666067.58 4758138.49,666067.67 4758135.25,666063.02 4758132.72,666042.02 4758131.04,666023.6 4758133.5,666010.31 4758137.34,665997.7 4758143.07,665993.51 4758143.03,665991.35 4758141.19,665992.05 4758136.96,666030.66 4758068.05,666041.79 4758057.64,666046.48 4758055.59,666057.08 4758053.49,666060.43 4758051.2,666072.68 4758037.16,666072.63 4758032.68,666070.62 4758031.14,666066.68 4758030.54,666042.64 4758030.56,666022.05 4758027.45,666012.96 4758027.11,666005.87 4758030,665990.77 4758039.62,665966.95 4758046.11,665907.18 4758046.11,665902.42 4758044.42,665899.37 4758039.84,665895.95 4758029.34,665895.73 4758024.82,665897.38 4758020.14,665900.92 4758017.2,665922.24 4758008.82,665932.82 4758001.74,665937.85 4757994.07,665945.21 4757979.19,665952.48 4757970.42,665974.25 4757961.45,665977.99 4757957.91,665981.83 4757951.49,665985.48 4757937,665988.96 4757927.99,665999.26 4757909.77,666001.67 4757899.32,666002.79 4757885.13,666004.82 4757878.31,666020.44 4757854.21,666023.47 4757845.85,666026.28 4757832.01,666029.77 4757826.73,666034.66 4757822.7,666042.7 4757819.21,666052.8 4757818.9,666067.77 4757822.82,666075.4 4757819.88,666084.23 4757811.3"
    //.split(',')
    //.map(function (coord) {
    //    var point = coord.split(' ')
    //    return [parseFloat(point[0]), parseFloat(point[1])];
    //});


    //var parcela = [];
    //Polygon.forEach(function (g) {
    //   parcela.push(coord2ToVec3(g, height));
    //});
    
    //var polygonShape = new THREE.Shape(parcela)

    

    //polygonShape.autoClose = true;
    //var points = polygonShape.createPointsGeometry();

    //var x = -300, y = -100, z = 0, rx = 0, ry = 0, rz = 0, s = 1;
    

    //var geometry = new THREE.ShapeGeometry(polygonShape);

    //var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: '#fff' }));
    //mesh.position.set(x, y, z +50);
    //mesh.rotation.set(rx, ry, rz);
    //mesh.scale.set(s, s, s);
    //group.add(mesh);

    
}

function uploadTex() {
    var gl = document.createElement("canvas").getContext("webgl");
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        log("DONE: ", gl.getError());
    } catch (e) {
        log("FAILED to use image because of security:", e);
    }
}

var coord2ToVec3 = function (coord2, height) {
    height = height || 0;
    return new THREE.Vector3(coord2[0], height, -coord2[1]);
};

var coord3ToVec3 = function (coord3) {

    return new THREE.Vector3(coord3[0], coord3[2], -coord3[1]);
};