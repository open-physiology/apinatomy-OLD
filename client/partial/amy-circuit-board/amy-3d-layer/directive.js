'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery',
        'lodash',
        'angular',
        'app/module',
        'threejs',
        'threejs-obj-loader',
        'threejs-swc-loader',
        'threejs-css-3d-renderer',
        'threejs-trackball-controls',
        '$bind/service',
        'defaults/service'
], function ($, _, ng, app, THREE) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	function getCompoundBoundingBox(object3D) {
		var box = null;
		object3D.traverse(function (obj3D) {
			var geometry = obj3D.geometry;
			if (geometry === undefined) return;
			geometry.computeBoundingBox();
			if (box === null) {
				box = geometry.boundingBox;
			} else {
				box.union(geometry.boundingBox);
			}
		});
		return box;
	}


	var DEG_TO_RAD = Math.PI / 180;


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amy3dLayer', ['$window', '$bind', 'ResourceService', function ($window, $bind, Resources) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			replace : true,
			template: '<div amy-3d-layer></div>',
			scope   : true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement, iAttrs/*, controller*/) {

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
						function render() {
							renderer.render(scene, camera);
							cssRenderer.render(scene, camera);
						}
						$scope.$on('$destroy', function () {
							render = _.noop;
						});
						onResizeAndNow(function () {
							renderer.setSize(iElement.width(), iElement.height());
							cssRenderer.setSize(iElement.width(), iElement.height());
							render();
						});


						//////////////////// circuit-board ///////////////////

//						// circuit-board surface wireframe for debugging purposes
//						var material = new THREE.MeshBasicMaterial({ color: '#000000', wireframe: true });
//						var geometry = new THREE.PlaneGeometry(iElement.width(), iElement.height(), 30, 30);
//						var planeMesh= new THREE.Mesh( geometry, material );
//						scene.add(planeMesh);

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
								width : iElement.width()  -(margin.left + margin.right),
								height: iElement.height() -(margin.top + margin.bottom)
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


						//////////////////// the animation loop ////////////////////

						(function animate() {
							$window.requestAnimationFrame(animate);
							controls.update();
							render();
						}());


						//////////////////// loading manager ////////////////////

						var loadingManager = new THREE.LoadingManager();


						//////////////////// tile interfaces ////////////////////

						var tileObjects = {};
						$scope.threeDLayerDeferred.resolve({
							new3dGroup: function new3dGroup() {
								var id = _.uniqueId('position');
								var obj3d = new THREE.Object3D();
								tileObjects[id] = obj3d;
								scene.add(obj3d);

								return {
									remove: function remove() {
										scene.remove(obj3d);
										delete tileObjects[id];
									},
									setRegion: function setRegion(region) {
										obj3d.position.x = baseX + (region.left + 0.5 * region.width);
										obj3d.position.y = baseY - (region.top  + 0.5 * region.height);
										// TODO: call some update function
									},
									get object() { return obj3d; },
									get loadingManager() { return loadingManager; }
								};
							}
						});















//						//////////////////// loading the .obj files ////////////////////
//
//						var objLoader = new THREE.OBJLoader(loadingManager);
//						var swcLoader = new THREE.SWCLoader(loadingManager);
//
//						$scope.entityObjects = {};
//
//						$scope.$watchCollection('activeTiles', function (activeTiles) {
//							Resources.threeDModels(_.keys(activeTiles)).then(function (modelMap) {
//								var idsWithObjects = [];
//								_(modelMap).forEach(function (models, id) {
//									if (!_(models).isEmpty()) {
//										idsWithObjects.push(id);
//										if (_($scope.entityObjects[id]).isUndefined()) {
//											var filename = models[0]; //// TODO: options to switch; now getting only the first
//
//											var loader;
//											if (/\.swc$/.test(filename)) {
//												loader = swcLoader;
//											} else if (/\.obj$/.test(filename)) {
//												loader = objLoader;
//											} else {
//												console.error('The file "' + filename + '" is not supported.');
//												return;
//											}
//
//											loader.load(filename, $bind(function (obj) {
//
//												var boundingBox = getCompoundBoundingBox(obj);
//
//												//// Normalize position
//
//												var translation = boundingBox.center().negate();
//												obj.children[0].geometry.applyMatrix(new THREE.Matrix4().setPosition(translation));
//
//												//// Model position/size + reposition when tile position changes
//
//												var deregisterPos = $scope.$watch('activeTiles["' + id + '"].position', function (pos) {
//													if (!_(pos).isUndefined()) {
//														var ratio = Math.min(pos.width / boundingBox.size().x, pos.height / boundingBox.size().y) * .7;
//														if (/\.swc/.test(filename)) {
//															ratio *= 2;
//														}
//														obj.position.x = baseX + pos.left + pos.width / 2;
//														obj.position.y = baseY - pos.top - pos.height / 2;
//														obj.position.z = 0.5 * ratio * boundingBox.size().z + 30;
//														obj.scale.set(ratio, ratio, ratio);
//
//														if (/\.swc/.test(filename)) {
//															obj.regenerateMaterial(iElement.height(), camera.fov);
//														}
//
//														render();
//													}
//												}, true);
//
//												var deregisterShow = $scope.$watch('activeTiles["' + id + '"].show', function (showNow, showBefore) {
//													if (!_(showNow).isUndefined()) {
//														if (showNow === 'true') {
//															scene.add(obj);
//														} else if (!_(showBefore).isUndefined()) {
//															scene.remove(obj);
//														}
//														render();
//													}
//												});
//
//												//// Store object
//
//												$scope.entityObjects[id] = obj;
//												$scope.entityObjects[id].deregisterNgWatch = _.compose(deregisterPos, deregisterShow);
//											}));
//										}
//									}
//								});
//
//								_($scope.entityObjects).keys().difference(idsWithObjects).forEach(function (id) {
//									$scope.entityObjects[id].deregisterNgWatch();
//									scene.remove($scope.entityObjects[id]);
//									delete $scope.entityObjects[id];
//								});
//								render();
//							});
//						});


//						///////////////////////// proteins ////////////////////////////////
//
//						$scope.proteinKebabData = {};
//
//						var COLORS = [
//							'red',
//							'blue',
//							'green',
//							'purple',
//							'yellow',
//							'gray'
//						];
//
//						function generateRandomKebabData() {
//							var length = _.random(100, 1000);
//
//							var domainCount = _.random(2, 7);
//							var domainBoundaries = [];
//
//							for (var i = 0; i < 2 * domainCount; ++i) {
//								domainBoundaries.push(_.random(1, 1000));
//							}
//							domainBoundaries = _.sortBy(domainBoundaries);
//
//							var domains = [];
//							for (var j = 0; j < 2 * domainCount; j += 2) {
//								var domainLength = domainBoundaries[j + 1] - domainBoundaries[j];
//								if (10 <= domainLength && domainLength <= 100 && domainBoundaries[j + 1] <= length) {
//									domains.push({
//										from : domainBoundaries[j],
//										to   : domainBoundaries[j + 1],
//										color: COLORS[_.random(0, 5)]
//									});
//								}
//							}
//
//							return {
//								length : length,
//								domains: domains
//							};
//						}
//
//						$scope.proteinKebabObjects = {};
//
//						var deregisterProteinWatch;
//						$scope.$watch('showProteins', function (showProteins) {
//							if (showProteins) {
//								deregisterProteinWatch = $scope.$watchCollection('visibleProteins', function (visibleProteins) {
//									var idsWithObjects = [];
//									_(visibleProteins).forEach(function (protein, id) {
//										idsWithObjects.push(id);
//										if (_($scope.proteinKebabObjects[id]).isUndefined()) {
//
//											if (_($scope.proteinKebabData[id]).isUndefined()) {
//												$scope.proteinKebabData[id] = generateRandomKebabData();
//											}
//											var kebabData = $scope.proteinKebabData[id];
//
//											var kebab = new THREE.Object3D();
//
//											var stickMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
//
//											var stickGeometry = new THREE.CylinderGeometry(1, 1, kebabData.length, 32);
//
//											var domainGeometry = new THREE.CylinderGeometry(6, 6, 1, 32);
//											_(kebabData.domains).forEach(function (domain) {
//												var domainMaterial = new THREE.MeshLambertMaterial({color: domain.color});
//												var domainObj = new THREE.Mesh(domainGeometry, domainMaterial);
//												domainObj.translateY(.5 * domain.from + .5 * domain.to);
//												domainObj.scale.y = (domain.to - domain.from);
//												kebab.add(domainObj);
//											});
//
//											var stick = new THREE.Mesh(stickGeometry, stickMaterial);
//											stick.translateY(kebabData.length / 2);
//											kebab.add(stick);
//
//											kebab.rotation.x = 90 * DEG_TO_RAD;
//											kebab.scale.y = .3;
//
//											$scope.proteinKebabObjects[id] = kebab;
//
//											scene.add(kebab);
//
//											var deregisterProteinWatchX = $scope.$watch('visibleProteins["' + id + '"].x', function (x) {
//												kebab.position.x = baseX + x;
//											});
//
//											var deregisterProteinWatchY = $scope.$watch('visibleProteins["' + id + '"].y', function (y) {
//												kebab.position.y = baseY - y;
//											});
//
//											$scope.proteinKebabObjects[id].deregisterNgWatch = _.compose(deregisterProteinWatchX, deregisterProteinWatchY);
//										}
//									});
//
//									_($scope.proteinKebabObjects).keys().difference(idsWithObjects).forEach(function (id) {
//										$scope.proteinKebabObjects[id].deregisterNgWatch();
//										scene.remove($scope.proteinKebabObjects[id]);
//										delete $scope.proteinKebabObjects[id];
//									});
//
//									render();
//								});
//							} else if (_(deregisterProteinWatch).isFunction()) {
//								_($scope.proteinKebabObjects).forEach(function (kebab, id) {
//									$scope.proteinKebabObjects[id].deregisterNgWatch();
//									scene.remove($scope.proteinKebabObjects[id]);
//									delete $scope.proteinKebabObjects[id];
//								});
//								deregisterProteinWatch();
//							}
//						});











					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {
					}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////