Q3D.gui = {

  type: "dat-gui",

  parameters: {
    lyr: [],
    cp: {
      c: "#32AD88",
      d: 0,
      o: 0.4,
      l: false
    },
    i: Q3D.application.showInfo.bind(Q3D.application)
  },

  // initialize gui
  // - setupDefaultItems: default is true
  init: function (setupDefaultItems) {
    this.gui = new dat.GUI();
    this.gui.domElement.parentElement.style.zIndex = 1000;   // display the panel on the front of labels
    if (setupDefaultItems === undefined || setupDefaultItems == true) {
      this.addLayersFolder();
      this.addCustomPlaneFolder();
      this.addHelpButton();
    }
  },

  addLayersFolder: function () {
    var parameters = this.parameters;
    var layersFolder = this.gui.addFolder('Layers');

    var visibleChanged = function (value) { project.layers[this.object.i].setVisible(value); };
    var opacityChanged = function (value) { project.layers[this.object.i].setOpacity(value); };
    var sideVisibleChanged = function (value) { project.layers[this.object.i].setSideVisibility(value); };

    project.layers.forEach(function (layer, i) {
      parameters.lyr[i] = {i: i, v: layer.visible, o: layer.opacity};
      var folder = layersFolder.addFolder(layer.name);
      folder.add(parameters.lyr[i], 'v').name('Visible').onChange(visibleChanged);

      if (layer.type == Q3D.LayerType.DEM) {
        var itemName = '';
        if (layer.blocks[0].s) itemName = 'Sides and bottom';
        else if (layer.blocks[0].frame) itemName = 'Frame';

        if (itemName) {
          parameters.lyr[i].sv = true;
          folder.add(parameters.lyr[i], 'sv').name(itemName).onChange(sideVisibleChanged);
        }
      }

      folder.add(parameters.lyr[i], 'o').min(0).max(1).name('Opacity').onChange(opacityChanged);
    });
  },

  addCustomPlaneFolder: function () {
    var customPlane;
    var parameters = this.parameters;
    var addPlane = function (color) {
      // Add a new plane in the current scene
      var geometry = new THREE.PlaneBufferGeometry(project.width, project.height, 1, 1),
          material = new THREE.MeshLambertMaterial({color: color, transparent: true});
      if (!Q3D.isIE) material.side = THREE.DoubleSide;
      customPlane = new THREE.Mesh(geometry, material);
      Q3D.application.scene.add(customPlane);
    };

    // Min/Max value for the plane
    var zMin = (project.layers[0].type == Q3D.LayerType.DEM) ? project.layers[0].stats.min + 0 : 1,
        zMax = (project.layers[0].type == Q3D.LayerType.DEM) ? project.layers[0].stats.max + 1000 : 9000;
    parameters.cp.d = zMin;

    // Create Custom Plane folder
    var folder = this.gui.addFolder('Custom Plane');

    // Plane color
    folder.addColor(parameters.cp, 'c').name('Color').onChange(function (value) {
      if (customPlane === undefined) addPlane(parameters.cp.c);
      customPlane.material.color.setStyle(value);
    });

    // Plane height
    folder.add(parameters.cp, 'd').min(zMin).max(zMax).name('Sea Level Rise').onChange(function (value) {
      if (customPlane === undefined) addPlane(parameters.cp.c);
      customPlane.position.z = (value + project.zShift) * project.zScale;
    });

    // Plane opacity
    folder.add(parameters.cp, 'o').min(0).max(1).name('Opacity (0-1)').onChange(function (value) {
      if (customPlane === undefined) addPlane(parameters.cp.c);
      customPlane.material.opacity = value;
    });

    // Enlarge plane option
    folder.add(parameters.cp, 'l').name('Enlarge').onChange(function (value) {
      if (customPlane === undefined) addPlane(parameters.cp.c);
      if (value) customPlane.scale.set(10, 10, 1);
      else customPlane.scale.set(1, 1, 1);
    });
  },

  addHelpButton: function () {
    this.gui.add(this.parameters, 'i').name('Help');
  }
};
