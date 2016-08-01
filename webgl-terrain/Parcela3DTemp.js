var controls, scene, camera, renderer, referencia;
var server = 'http://10.57.224.240/Servicios'; //'http://localhost:50919'; //

loadParcela3D = function (refcat) {

	var width = window.innerWidth,
		height = window.innerHeight,
		Url_Datos3D = server + '/ImagenServicio.svc/ObtenerDatos3D?referencia=' + refcat;

	//THREE.DefaultLoadingManager.onProgress = function(item, loaded, total) {
	//	console.log(item, loaded, total);
	//};

	$("#progress").css("display", "block");

	var callbackProgress = function (progress, result) {

		var bar = 250,
			total = progress.total, //progress.totalModels + progress.totalTextures,
			loaded = progress.loaded; //progress.loadedModels +progress.loadedTextures;

		if (total)
			bar = Math.floor(bar * loaded / total);

		$("#bar").css("width", bar + "px");

	};

	scene = new THREE.Scene();
	scene.add(new THREE.AmbientLight(0xeeeeee));

	camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
	camera.position.set(0, -300, 300);

	renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	renderer.setSize(width, height);
	renderer.autoClear = true;


	var terrainLoader = new THREE.WcsTerrainLoader();
	terrainLoader.jsonpCallback = 'jsonpCallback';
	terrainLoader.load(Url_Datos3D, jsonpCallback, callbackProgress);

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

		Array.prototype.min = function () {
			return Math.min.apply(null, this);
		};

		var alt_min = data.min();

		//La distancia de la imagen total es de 1200 metros (x,y)
		//Para el 3 y 4 parametro la distancia es entre 25 metros del raster: Ejemplo (1200 / 25) = 48
		var geometry = new THREE.PlaneGeometry(widthSeg * 10, heightSeg * 10, widthSeg, heightSeg); //(90, 130, 9, 13)

		for (var i = 0, l = geometry.vertices.length; i < l; i++) {
			geometry.vertices[i].z = (data[i] - alt_min + 50) / divisor;
		}

		var wmsUrl = server + '/ImagenServicio.svc/ObtenerImagen?delegacion=' + dele + '&mapa=' + mapa + '&srid=' + srid + '&bbox=' + bboxArea3D.join('%2C') + '&referencia=' + referencia + '&ancho=' + ancho + '&alto=' + alto;

		THREE.ImageUtils.crossOrigin = 'anonymous';

		var texture = THREE.ImageUtils.loadTexture(wmsUrl);

		var material = new THREE.MeshPhongMaterial({
			map: texture
		});

		var plane = new THREE.Mesh(geometry, material);
		scene.add(plane);

		$("#progress").css("display", "none");

	}
	else {
		$("#message").html("Referencia Catastral No Válida!!!");
		$("#progressbar").css("display", "none");
	}


}