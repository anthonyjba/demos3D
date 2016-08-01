/**
 * Parcela3D : Extension class to Three.js
 * Created by: Anthony Bonifacio (anthonyjba@gmail.com)
 */

'use strict';   

    THREE.Parcela3D = function (o) {
    
        var self = this,            
            element, width, height,
            controls, scene, camera, renderer;

        element = o.container;
        width = (o.width) ? o.width : element.hasAttribute("width") ? +element.getAttribute("width") : 0;
        height = (o.height) ? o.height : element.hasAttribute("height") ? +element.getAttribute("height") : 0;

        if (!width && !height) {
            width = window.innerWidth;
            height = window.innerHeight;
        }

        //Asigna valores a params
        var params = {};
        params.boundingbox = o.bbox.split(',').map(function (p) { return parseFloat(p) });
        params.distance = o.distance;

        function getType(type){
            if (type.tolower() === 'canvas') {
                return new THREE.CanvasRenderer({ alpha: true, antialias: true });
            } else {
                return new THREE.WebGLRenderer({ alpha: true, antialias: true });
            }
        }


        renderer = !o.type ? new THREE.WebGLRenderer({ alpha: true, antialias: true }) : getType(o.type);
        renderer.setSize(width, height);
        renderer.autoClear = true;

        scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xeeeeee));

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        camera.position.set(0, -300, 300);
        
        self.status = null;

        /* Function Load Parcela */
        self.loadParcela = function (urlGeometry, urlTexture, callback) {

            /** Cálculo del WidthSegment, HeightSegment y divisor ***/
            var xMin, xMax, yMin, yMax;
            xMin = params.boundingbox[0];
            yMin = params.boundingbox[1];
            xMax = params.boundingbox[2];
            yMax = params.boundingbox[3];

            var anchoArea3D = xMax - xMin;
            var altoArea3D = yMax - yMin;

            params.widthSeg = (anchoArea3D) / params.distance;
            params.heightSeg = (altoArea3D) / params.distance;
            params.divisor = (anchoArea3D / (params.widthSeg * 10)) / 1; //widthSeg * 10; //12 = (1200 / 100) (100: ancho del primer parametro PlaneGeometry)


            /*** GROUP to all scenes **/
            var group = new THREE.Group();
            scene.add(group);

            var req1 = new Promise(function (resolve, reject) {

                //console.time('DatosDEM');

                /*** Load TerrainLoader Vertices of geometries **/
                var terrainLoader = new THREE.WcsTerrainLoader();
                terrainLoader.load(urlGeometry, function (data) {

                    var lowest = Number.POSITIVE_INFINITY;

                    params.data = data.split("\n").map(function (value) {
                        var dem = parseFloat(value.split(' ')[2])
                        if (dem < lowest) lowest = dem;
                        return dem;
                    })
                    params.alt_min = lowest;

                    //Delete the last empty row
                    params.data.pop();


                    //La distancia de la imagen total es de 1200 metros (x,y)
                    //Para el 3 y 4 parametro la distancia es entre 25 metros del raster: Ejemplo (1200 / 25) = 48
                    params.geometry = new THREE.PlaneGeometry(params.widthSeg * 10, params.heightSeg * 10, params.widthSeg, params.heightSeg); //(90, 130, 9, 13)
                    

                    for (var i = 0, l = params.geometry.vertices.length; i < l; i++) {
                        params.geometry.vertices[i].z = (params.data[i] - params.alt_min + 50) / params.divisor;
                    }

                    resolve(params.geometry);
                    
                    //console.timeEnd('DatosDEM');

                });

            });

                
            var req2 = new Promise(function (resolve, reject) {
                
                //console.time('Texture');

                /*** Load Image rater to render parcela */
                THREE.ImageUtils.crossOrigin = 'anonymous';


                var loader = new THREE.TextureLoader();
                loader.load(
                        urlTexture,
                        // Function when resource is loaded
                        function (texture) {
                            // do something with the texture
                            params.material = new THREE.MeshBasicMaterial({
                                map: texture, overdraw: 1
                            });

                            //console.timeEnd('Texture');
                            resolve(params.material);

                        },
                        // Function called when download progresses
                        function (xhr) {                
                            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                        },
                        // Function called when download errors
                        function (error) {
                            reject('An error happened to get Parcela 3D');
                        }
                 );

            });

            Promise.all([req1, req2]).then(function (results) {

                if (results[0].type === "PlaneGeometry" && results[1].type === "MeshBasicMaterial") {
                    self.status = "OK"
                    renderWhenfinishPromise();
                }

            }).catch(function (err) {
                console.log('Catch: ', err);
                self.status = "Error";

                if (typeof callback === 'function')
                    callback(self.status);
            });



            function renderWhenfinishPromise() {
                var mesh = new THREE.Mesh(params.geometry, params.material);                    
                group.add(mesh);

                //Flechas
                var dir = new THREE.Vector3(1, 0, 0);
                var origin = new THREE.Vector3(-params.widthSeg * 5, -params.heightSeg * 5, (params.data[(params.widthSeg + 1) * params.heightSeg] - params.alt_min + 50) / params.divisor);
                var length = params.widthSeg;
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

                if (typeof callback === 'function')
                    callback(self.status);
            }

            return Promise;
        }

        //MouseWhell Control
        controls = new THREE.TrackballControls(camera, element);

        //Create a canvas with the parcel render
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        element.appendChild(renderer.domElement);


         function render() {
            controls.update();
            requestAnimationFrame(render);
            renderer.render(scene, camera);
        }

        render();
    }

