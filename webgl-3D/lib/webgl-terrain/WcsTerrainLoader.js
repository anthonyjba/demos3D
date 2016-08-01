/**
 * @author Bjorn Sandvik / http://thematicmapping.org/
 */

THREE.WcsTerrainLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.WcsTerrainLoader.prototype = {

	constructor: THREE.TerrainLoader,

	load: function (url, onLoad, onProgress, onError) {

	    var scope = this;
	    

		var request = new XMLHttpRequest();

		if ( onLoad !== undefined ) {

			request.addEventListener( 'load', function ( event ) {

			    onLoad(JSON.parse(event.target.response)

                    //event.target.response.split("\n").map(function (value) {
					//return parseFloat( value.split( ' ' )[2]);
				    //})

                );

				scope.manager.itemEnd( url );

			}, false );

		}

		if ( onProgress !== undefined ) {

			request.addEventListener( 'progress', function ( event ) {

				onProgress( event );

			}, false );

		}

		if ( onError !== undefined ) {

			request.addEventListener( 'error', function ( event ) {

				onError( event );

			}, false );

		}

		if (this.crossOrigin !== undefined) request.crossOrigin = this.crossOrigin;

		if (this.jsonp !== undefined) {
		    scope.manager.itemEnd(url);
		    return scope.jsonpHandler(url, this.jsonpCallback);
		}
        else{

		    request.open( 'GET', url, true );

		    request.send( null );
		}

		scope.manager.itemStart( url );

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

    webglAvailable : function () {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl'))
        );
        } catch (e) {
            return false;
        }
    },

    GetIEVersion : function() {
        var sAgent = window.navigator.userAgent;
        var Idx = sAgent.indexOf("MSIE");

        // If IE, return version number.  
        if (Idx > 0) 
            return parseInt(sAgent.substring(Idx+ 5, sAgent.indexOf(".", Idx)));

            // If IE 11 then look for Updated user agent string.
        else if (!!navigator.userAgent.match(/Trident\/7\./)) 
            return 11;

        else
            return 0; //It is not IE
    },

	jsonpHandler: function (url, callback) {
	    var head = document.head;
	    var script = document.createElement("script");

	    var scripturl = url + ((url.indexOf("?") !== -1) ? "&" : "?") + "callback=" + callback;

	    script.setAttribute("src", scripturl);
	    head.appendChild(script);
	    head.removeChild(script);
        
	}

};

