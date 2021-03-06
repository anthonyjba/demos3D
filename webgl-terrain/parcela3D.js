﻿var controls, scene, camera, renderer, referencia;

Array.prototype.min = function () {
    return Math.min.apply(null, this);
};

loadParcela3D = function (refcat, width, height) {

    var server = 'http://10.57.224.240/Servicios';
    var currentProgress = 0,
    Url_Datos3D = server + '/ImagenServicio.svc/ObtenerDatos3D?referencia=' + refcat;

    function webglAvailable() {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (
				canvas.getContext('webgl') ||
				canvas.getContext('experimental-webgl'))
			);
        } catch (e) {
            return false;
        }
    }

    if (webglAvailable()) {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } else {
        renderer = new THREE.CanvasRenderer({ alpha: true, antialias: true });
    }

    if (!width && !height) {
        var width = window.innerWidth;
        var height = window.innerHeight;
    }


    $("#progress").css("display", "block");

    var callbackProgress = function (progress, result) {
        var bar = 125,
            total = progress.total,
            loaded = progress.loaded;

        if (total)
            bar = Math.floor(bar * loaded / total);

        $("#bar").css("width", currentProgress + bar + "px");

    };

    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xeeeeee));

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, -300, 300);

    //renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.autoClear = true;


    var terrainLoader = new THREE.WcsTerrainLoader();

    terrainLoader.load(Url_Datos3D, function (data) {
        var params = jsonpCallback(data);

        if (params) {

            var Url_foto = server + '/ImagenServicio.svc/ObtenerImagen?delegacion=' + params.delegacion + '&mapa=' + params.mapa + '&srid=' + params.srid + '&bbox=' + params.bboxArea3D.join('%2C') + '&referencia=' + params.referencia + '&ancho=' + params.ancho + '&alto=' + params.alto;
            currentProgress = 125;

            //Flechas
            var dir = new THREE.Vector3(1, 0, 0);
            var origin = new THREE.Vector3(-params.g_widthSeg * 5, -params.g_heightSeg * 5, (params.g_data[(params.g_widthSeg + 1) * params.g_heightSeg] - params.g_alt_min + 50) / params.g_divisor);
            var length = params.g_widthSeg;
            var hex = 0x00ff00;

            var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
            scene.add(arrowHelper);

            dir = new THREE.Vector3(0, 1, 0);
            hex = 0xff0000;
            arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
            scene.add(arrowHelper);

            dir = new THREE.Vector3(0, 0, 1);
            hex = 0x0000ff;
            arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
            scene.add(arrowHelper);

            //La distancia de la imagen total es de 1200 metros (x,y)
            //Para el 3 y 4 parametro la distancia es entre 25 metros del raster: Ejemplo (1200 / 25) = 48
            var geometry = new THREE.PlaneGeometry(params.g_widthSeg * 10, params.g_heightSeg * 10, params.g_widthSeg, params.g_heightSeg); //(90, 130, 9, 13)

            for (var i = 0, l = geometry.vertices.length; i < l; i++) {
                geometry.vertices[i].z = (params.g_data[i] - params.g_alt_min + 50) / params.g_divisor;
            }

            THREE.ImageUtils.crossOrigin = 'anonymous';

            /***GROUP **/
            var group = new THREE.Group();
            scene.add(group);

            var loader = new THREE.TextureLoader();
            loader.load(
                Url_foto,
                // Function when resource is loaded
                function (texture) {
                    // do something with the texture
                    var material = new THREE.MeshBasicMaterial({
                        map: texture, overdraw: 1
                    });
                    var mesh = new THREE.Mesh(geometry, material);
                    group.add(mesh);
                },
                        // Function called when download progresses
                        function (xhr) {
                            callbackProgress(xhr);
                            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                        },
                            // Function called when download errors
                            function (xhr) {
                                console.log('An error happened');
                            }
             );

            $("#progress").css("display", "none");
        }
        else {
            $("#message").html("Referencia Catastral No Válida!!!");
            $("#progressbar").css("display", "none");
        }
    },
    callbackProgress);

    var myNode = document.getElementById('webgl');
    controls = new THREE.TrackballControls(camera, myNode);

    while (myNode.hasChildNodes()) {
        myNode.removeChild(myNode.lastChild);
    }
    myNode.appendChild(renderer.domElement);



    render();
}

function render() {
    controls.update();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

function jsonpCallback(data) {
    var referencia, dele, mapa, srid, bboxArea3D, ancho, alto;

    if (typeof data === "string" && data.length > 0) {
        var arrData = data.split("\n");

        referencia = arrData[0];
        var dataRC = arrData[1].split(',');
        dele = dataRC[0]; mapa = dataRC[1]; srid = dataRC[2]; ancho = dataRC[3]; alto = dataRC[4];
        bboxArea3D = arrData[2].split(',').map(function (p) { return parseFloat(p) });

        arrData.shift(); arrData.shift(); arrData.shift();

        data = arrData.map(function (value) {
            return parseFloat(value.split(' ')[2]);
        })
        data.pop();

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
            divisor = (anchoArea3D / (widthSeg * 10)) / 1; //widthSeg * 10; //12 = (1200 / 100) (100: ancho del primer parametro PlaneGeometry)

        /** retorno de parámetros ***/
        return {
            referencia: referencia, delegacion: dele, mapa: mapa, srid: srid, bboxArea3D: bboxArea3D, ancho: ancho, alto: alto,
            g_widthSeg: widthSeg, g_heightSeg: heightSeg, g_alt_min: data.min(), g_divisor: divisor, g_data: data
        };
    }
    else {
        return null;
    }


}