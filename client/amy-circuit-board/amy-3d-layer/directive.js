'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery',
        'lodash',
        'angular',
        'app/module',
        'stats',
        'threejs',
        'css!amy-circuit-board/amy-3d-layer/style',
        'threejs-css-3d-renderer',
        'threejs-trackball-controls',
        'threejs-obj-loader',
        'threejs-swc-loader',
        'threex-domevents',
        '$bind/service'
], function ($, _, ng, app, Stats, THREE) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEG_TO_RAD = Math.PI / 180;


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amy3dLayer', ['$window', '$bind', function ($window, $bind) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			replace : true,
			template: '<div amy-3d-layer></div>',
			scope   : true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						//////////////////// maintenance functions ////////////////////

						var onResizeHandlers = [];
						function callOnResize() { _(onResizeHandlers).forEach(_.call); }
						$($window).on('resize', callOnResize);
						$scope.$on('$destroy', function () { $($window).off('resize', callOnResize); });

						function onResize(fn) { onResizeHandlers.push(fn); }

						function onResizeAndNow(fn) { onResize(fn); fn(); }


						//////////////////// interface to the outside ////////////////////

						var iface = {};


						//////////////////// camera ////////////////////

						var camera = new THREE.PerspectiveCamera(60, iElement.width() / iElement.height(), 1, 10000);
						camera.position.z = iElement.height() / (2 * Math.tan(camera.fov * DEG_TO_RAD / 2));

						onResize(function () {
							camera.aspect = iElement.width() / iElement.height();
							camera.updateProjectionMatrix();
						});


						//////////////////// scene ////////////////////

						var scene = new THREE.Scene();


						//////////////////// lighting ////////////////////

						var ambientLight = new THREE.AmbientLight(0x101030);
						scene.add(ambientLight);

						var directionalLight1 = new THREE.DirectionalLight(0xffeedd);
						directionalLight1.position.set(1, -1, 1);
						scene.add(directionalLight1);

						var directionalLight2 = new THREE.DirectionalLight(0xffeedd);
						directionalLight2.position.set(-1, 1, -1);
						scene.add(directionalLight2);


						//////////////////// renderer ////////////////////

						//// setup
						//
						var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
						var cssRenderer = new THREE.CSS3DRenderer();
						$(cssRenderer.domElement).append(renderer.domElement);
						iElement.append(cssRenderer.domElement);


						//// rendering
						//
						function innerRender() {
							renderer.render(scene, camera);
							cssRenderer.render(scene, camera);
						}
						var render = _.throttle(function render() { innerRender() }, 1000 / 30); // max 30 fps
						$scope.$on('$destroy', function () { innerRender = _.noop; }); // immediately stop rendering at $destroy
						onResizeAndNow(function () {
							renderer.setSize(iElement.width(), iElement.height());
							cssRenderer.setSize(iElement.width(), iElement.height());
							render();
						});


						//////////////////// circuit-board ///////////////////

						//// the circuit-board itself
						//
						var flatCircuitBoardElement = $scope.flatCircuitBoardElement;
						var fullCircuitBoardElement = flatCircuitBoardElement.parent();
						var flatCircuitBoard = new THREE.CSS3DObject(flatCircuitBoardElement[0]);
						flatCircuitBoardElement.css('backfaceVisibility', 'hidden');
						scene.add(flatCircuitBoard);
						$scope.$on('$destroy', function () {
							flatCircuitBoardElement.css({
								WebkitTransform: 'none',
								MozTransform   : 'none',
								oTransform     : 'none',
								transform      : 'none'
							});
							flatCircuitBoardElement.detach().prependTo(fullCircuitBoardElement);
						});


						//// circuit-board backface
						//
						var backfaceElement = $('<div></div>');
						var backface = new THREE.CSS3DObject(backfaceElement[0]);
						backfaceElement.css({
							position: 'absolute',
							border: 'solid 1px black',
							backfaceVisibility: 'hidden'
						});
						backface.rotation.set(Math.PI, 0, 0);
						scene.add(backface);


						//// sizing
						//
						var baseX, baseY;
						onResizeAndNow(function () {
							//// get the margins: everything in the initial canvas that is not circuit-board
							//
							var margin = $scope.circuitBoardMargins;

							//// sizing and positioning of the circuit-board and backface
							//
							var size = {
								width : iElement.width()  - (margin.left + margin.right),
								height: iElement.height() - (margin.top + margin.bottom)
							};

							flatCircuitBoardElement.css(size);
							flatCircuitBoard.position.x = -0.5 * (margin.left + margin.right);
							flatCircuitBoard.position.y = -0.5 * (margin.top + margin.bottom);

							backfaceElement.css(size);
							backface.position.x = 0.5 * (margin.left - margin.right);
							backface.position.y = 0.5 * (margin.top - margin.bottom);

							//// tile interfaces
							//
							baseX = 0.5 * (margin.left - margin.right - flatCircuitBoardElement.width());
							baseY = 0.5 * (margin.top - margin.bottom + flatCircuitBoardElement.height());
						});

						$scope.$watch('margin', function () { $($window).trigger('resize'); });


						//////////////////// controls ////////////////////

						var controls = new THREE.TrackballControls(camera, iElement[0]);
						controls.rotateSpeed = 1.0;
						controls.zoomSpeed = 1.2;
						controls.panSpeed = 0.8;
						controls.noZoom = false;
						controls.noPan = false;
						controls.staticMoving = true;
						controls.dynamicDampingFactor = 0.3;
						controls.keys = [ 65, 83, 68 ];
						controls.addEventListener('change', render);

						onResize(function () { controls.handleResize(); });


						//////////////////// the 3D animation loop ////////////////////

						//// keeping track of frame-rate
						//
						var stats = new Stats();
						stats.setMode(0);
						$(stats.domElement).appendTo($('[amy-side-nav]')).css({
							position: 'absolute', bottom: 5, left: 5
						});
						$scope.$on('$destroy', function () { $(stats.domElement).remove(); });

						//// the loop
						//
						(function animate() {
							stats.begin();
							$window.requestAnimationFrame(animate);
							controls.update();
							render();
							stats.end();
						}());


						//////////////////// mouse events on objects ////////////////////

						var domEvents = new THREEx.DomEvents(camera, iElement[0]);


						//////////////////// tile interfaces ////////////////////

						$scope.circuitBoard.threeDLayer = {
							new3dGroup: function new3dGroup() {
								var obj3d = new THREE.Object3D();
								scene.add(obj3d);

								return {
									remove: function remove() {
										scene.remove(obj3d);
									},
									setRegion: function setRegion(region) {
										obj3d.position.x = baseX + (region.left + 0.5 * region.width);
										obj3d.position.y = baseY - (region.top  + 0.5 * region.height);
										render();
									},
									on: function on(obj, eventName, fn) {
										obj.traverse(function (thing) {
											if (thing instanceof THREE.Mesh) {
												domEvents.addEventListener(thing, eventName, $bind(fn));
											}
										});
									},
									off: function off(obj, eventName, fn) {
										obj.traverse(function (thing) {
											if (thing instanceof THREE.Mesh) {
												domEvents.removeEventListener(thing, eventName, $bind(fn));
											}
										});
									},
									object: obj3d
								};
							}
						};

					}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////