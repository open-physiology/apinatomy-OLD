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


	app.directive('amyCanvas', ['$window', '$bind', 'ResourceService', function ($window, $bind, Resources) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			replace : false,
			scope   : {
				transformation     : '=amyTransformation',
				margin             : '=amyMargin',
				circuitBoardElement: '=amyCircuitBoardElement',
				activeTiles        : '=amyActiveTiles',
				visibleProteins    : '=amyVisibleProteins',
				showProteins       : '=amyShowProteins'
			},

			controller: ['$scope', '$rootScope', function (/*$scope, $rootScope*/) {
			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						function init() {

							//////////////////// camera ////////////////////

							$scope.camera = new THREE.PerspectiveCamera(60, iElement.width() / iElement.height(), 1, 10000);
							$scope.camera.position.z = iElement.height() / (2 * Math.tan($scope.camera.fov * DEG_TO_RAD / 2));

							//////////////////// scene ////////////////////

							$scope.scene = new THREE.Scene();

							//////////////////// lighting ////////////////////

							var ambientLight = new THREE.AmbientLight(0x101030);
							$scope.scene.add(ambientLight);

							var directionalLight1 = new THREE.DirectionalLight(0xffeedd);
							directionalLight1.position.set(1, -1, 1);
							$scope.scene.add(directionalLight1);

							var directionalLight2 = new THREE.DirectionalLight(0xffeedd);
							directionalLight2.position.set(-1, 1, -1);
							$scope.scene.add(directionalLight2);

							//////////////////// loading manager ////////////////////

							var manager = new THREE.LoadingManager();

							//////////////////// circuitboard ///////////////////

							(function () {
//								var material = new THREE.MeshBasicMaterial({ color: '#000000', wireframe: true });
//								var geometry = new THREE.PlaneGeometry(iElement.width(), iElement.height(), 30, 30);
//								var planeMesh= new THREE.Mesh( geometry, material );
//								$scope.scene.add(planeMesh);

								$scope.circuitBoard = new THREE.CSS3DObject($scope.circuitBoardElement[0]);

								$scope.circuitBoardElement.css({
									width : iElement.width() - $scope.margin.left - $scope.margin.right,
									height: iElement.height() - $scope.margin.top - $scope.margin.bottom
								});
								$scope.circuitBoard.position.x = -($scope.margin.left + $scope.margin.right) / 2;
								$scope.circuitBoard.position.y = -($scope.margin.top + $scope.margin.bottom) / 2;

								$scope.baseX = ($scope.margin.left - $scope.margin.right - $scope.circuitBoardElement.width()) / 2;
								$scope.baseY = ($scope.margin.top - $scope.margin.bottom + $scope.circuitBoardElement.height()) / 2;

								$scope.scene.add($scope.circuitBoard);

								$scope.backfaceElement = $('<div></div>');
								$scope.backface = new THREE.CSS3DObject($scope.backfaceElement[0]);
								$scope.backfaceElement.css({
									position          : 'absolute',
									width             : iElement.width() - $scope.margin.left - $scope.margin.right,
									height            : iElement.height() - $scope.margin.top - $scope.margin.bottom,
									border            : 'solid 1px black',
									backfaceVisibility: 'hidden'
								});
								$scope.backface.rotation.set(Math.PI, 0, 0);
								$scope.backface.position.x = $scope.margin.left / 2 - $scope.margin.right / 2;
								$scope.backface.position.y = $scope.margin.top / 2 - $scope.margin.bottom / 2;

								$scope.scene.add($scope.backface);

							}());

							//////////////////// loading the .obj files ////////////////////

							var objLoader = new THREE.OBJLoader(manager);
							var swcLoader = new THREE.SWCLoader(manager);

							$scope.entityObjects = {};

							$scope.$watchCollection('activeTiles', function (activeTiles) {
								Resources.threeDModels(_.keys(activeTiles)).then(function (modelMap) {
									var idsWithObjects = [];
									_(modelMap).forEach(function (models, id) {
										if (!_(models).isEmpty()) {
											idsWithObjects.push(id);
											if (_($scope.entityObjects[id]).isUndefined()) {
												var filename = models[0]; //// TODO: options to switch; now getting only the first

												var loader;
												if (/\.swc$/.test(filename)) {
													loader = swcLoader;
												} else if (/\.obj$/.test(filename)) {
													loader = objLoader;
												} else {
													console.error('The file "' + filename + '" is not supported.');
													return;
												}

												loader.load(filename, $bind(function (obj) {

													var boundingBox = getCompoundBoundingBox(obj);

													//// Normalize position

													var translation = boundingBox.center().negate();
													obj.children[0].geometry.applyMatrix(new THREE.Matrix4().setPosition(translation));

													//// Model position/size + reposition when tile position changes

													var deregisterPos = $scope.$watch('activeTiles["' + id + '"].position', function (pos) {
														if (!_(pos).isUndefined()) {
															var ratio = Math.min(pos.width / boundingBox.size().x, pos.height / boundingBox.size().y) * .7;
															if (/\.swc/.test(filename)) {
																ratio *= 2;
															}
															obj.position.x = $scope.baseX + pos.left + pos.width / 2;
															obj.position.y = $scope.baseY - pos.top - pos.height / 2;
															obj.position.z = 0.5 * ratio * boundingBox.size().z + 30;
															obj.scale.set(ratio, ratio, ratio);

															if (/\.swc/.test(filename)) {
																obj.regenerateMaterial(iElement.height(), $scope.camera.fov);
															}

															render();
														}
													}, true);

													var deregisterShow = $scope.$watch('activeTiles["' + id + '"].show', function (showNow, showBefore) {
														if (!_(showNow).isUndefined()) {
															if (showNow === 'true') {
																$scope.scene.add(obj);
															} else if (!_(showBefore).isUndefined()) {
																$scope.scene.remove(obj);
															}
															render();
														}
													});

													//// Store object

													$scope.entityObjects[id] = obj;
													$scope.entityObjects[id].deregisterNgWatch = _.compose(deregisterPos, deregisterShow);
												}));
											}
										}
									});

									_($scope.entityObjects).keys().difference(idsWithObjects).forEach(function (id) {
										$scope.entityObjects[id].deregisterNgWatch();
										$scope.scene.remove($scope.entityObjects[id]);
										delete $scope.entityObjects[id];
									});
									render();
								});
							});


							///////////////////////// PROTEINS ////////////////////////////////

							$scope.proteinKebabData = {};

							var COLORS = [
								'red',
								'blue',
								'green',
								'purple',
								'yellow',
								'gray'
							];

							function generateRandomKebabData() {
								var length = _.random(100, 1000);

								var domainCount = _.random(2, 7);
								var domainBoundaries = [];

								for (var i = 0; i < 2 * domainCount; ++i) {
									domainBoundaries.push(_.random(1, 1000));
								}
								domainBoundaries = _.sortBy(domainBoundaries);

								var domains = [];
								for (var j = 0; j < 2 * domainCount; j += 2) {
									var domainLength = domainBoundaries[j + 1] - domainBoundaries[j];
									if (10 <= domainLength && domainLength <= 100 && domainBoundaries[j + 1] <= length) {
										domains.push({
											from : domainBoundaries[j],
											to   : domainBoundaries[j + 1],
											color: COLORS[_.random(0, 5)]
										});
									}
								}

								return {
									length : length,
									domains: domains
								};
							}

							$scope.proteinKebabObjects = {};

							var deregisterProteinWatch;
							$scope.$watch('showProteins', function (showProteins) {
								if (showProteins) {
									deregisterProteinWatch = $scope.$watchCollection('visibleProteins', function (visibleProteins) {
										var idsWithObjects = [];
										_(visibleProteins).forEach(function (protein, id) {
											idsWithObjects.push(id);
											if (_($scope.proteinKebabObjects[id]).isUndefined()) {

												if (_($scope.proteinKebabData[id]).isUndefined()) {
													$scope.proteinKebabData[id] = generateRandomKebabData();
												}
												var kebabData = $scope.proteinKebabData[id];

												var kebab = new THREE.Object3D();

												var stickMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

												var stickGeometry = new THREE.CylinderGeometry(1, 1, kebabData.length, 32);

												var domainGeometry = new THREE.CylinderGeometry(6, 6, 1, 32);
												_(kebabData.domains).forEach(function (domain) {
													var domainMaterial = new THREE.MeshLambertMaterial({color: domain.color});
													var domainObj = new THREE.Mesh(domainGeometry, domainMaterial);
													domainObj.translateY(.5 * domain.from + .5 * domain.to);
													domainObj.scale.y = (domain.to - domain.from);
													kebab.add(domainObj);
												});

												var stick = new THREE.Mesh(stickGeometry, stickMaterial);
												stick.translateY(kebabData.length / 2);
												kebab.add(stick);

												kebab.rotation.x = 90 * DEG_TO_RAD;
												kebab.scale.y = .3;

												$scope.proteinKebabObjects[id] = kebab;

												$scope.scene.add(kebab);

												var deregisterProteinWatchX = $scope.$watch('visibleProteins["' + id + '"].x', function (x) {
													kebab.position.x = $scope.baseX + x;
												});

												var deregisterProteinWatchY = $scope.$watch('visibleProteins["' + id + '"].y', function (y) {
													kebab.position.y = $scope.baseY - y;
												});

												$scope.proteinKebabObjects[id].deregisterNgWatch = _.compose(deregisterProteinWatchX, deregisterProteinWatchY);
											}
										});

										_($scope.proteinKebabObjects).keys().difference(idsWithObjects).forEach(function (id) {
											$scope.proteinKebabObjects[id].deregisterNgWatch();
											$scope.scene.remove($scope.proteinKebabObjects[id]);
											delete $scope.proteinKebabObjects[id];
										});

										render();
									});
								} else if (_(deregisterProteinWatch).isFunction()) {
									deregisterProteinWatch();
								}
							});


							//////////////////// renderer ////////////////////

							$scope.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
							$scope.renderer.setSize(iElement.width(), iElement.height());

							$scope.cssRenderer = new THREE.CSS3DRenderer();
							$scope.cssRenderer.setSize(iElement.width(), iElement.height());
							$($scope.cssRenderer.domElement).append($scope.renderer.domElement);

							iElement.append($scope.cssRenderer.domElement);

							//////////////////// controls ////////////////////

							$scope.controls = new THREE.TrackballControls($scope.camera, iElement[0]);
							$scope.controls.rotateSpeed = 1.0;
							$scope.controls.zoomSpeed = 1.2;
							$scope.controls.panSpeed = 0.8;
							$scope.controls.noZoom = false;
							$scope.controls.noPan = false;
							$scope.controls.staticMoving = true;
							$scope.controls.dynamicDampingFactor = 0.3;
							$scope.controls.keys = [ 65, 83, 68 ];
							$scope.controls.addEventListener('change', render);
						}

						function animate() {
							requestAnimationFrame(animate);
							$scope.controls.update();
							render();
						}

						//// the function that actually renders the scene:

						function render() {
							if (!$scope.destroying) {
								$scope.renderer.render($scope.scene, $scope.camera);
								$scope.cssRenderer.render($scope.scene, $scope.camera);
							}
						}

						//// start doing stuff

						init();
						render();
						animate();

						//// reacting to window resize

						function onResize() {
							$scope.baseX = ($scope.margin.left - $scope.margin.right - $scope.circuitBoardElement.width()) / 2;
							$scope.baseY = ($scope.margin.top - $scope.margin.bottom + $scope.circuitBoardElement.height()) / 2;

							//// update the camera

							$scope.camera.aspect = iElement.width() / iElement.height();
							$scope.camera.updateProjectionMatrix();
							$scope.camera.position.z = iElement.height() / (2 * Math.tan($scope.camera.fov * DEG_TO_RAD / 2));

							//// update the renderer

							$scope.renderer.setSize(iElement.width(), iElement.height());
							$scope.cssRenderer.setSize(iElement.width(), iElement.height());

							//// update the circuit-board

							$scope.circuitBoardElement.css({
								width : iElement.width() - $scope.margin.left - $scope.margin.right,
								height: iElement.height() - $scope.margin.top - $scope.margin.bottom
							});
							$scope.circuitBoard.position.x = -($scope.margin.left + $scope.margin.right) / 2;
							$scope.circuitBoard.position.y = -($scope.margin.top + $scope.margin.bottom) / 2;

							//// update the circuit-board backface

							$scope.backfaceElement.css({
								width : iElement.width() - $scope.margin.left - $scope.margin.right,
								height: iElement.height() - $scope.margin.top - $scope.margin.bottom
							});
							$scope.backface.position.x = $scope.margin.left / 2 - $scope.margin.right / 2;
							$scope.backface.position.y = $scope.margin.top / 2 - $scope.margin.bottom / 2;

							//// update controls

							$scope.controls.handleResize();

							//// and render

							render();
						}

						//// react to events

						var bindOnResize = $bind(onResize);
						$($window).on('resize', bindOnResize);
						$scope.$watch('margin', onResize);
						$scope.$watch('object.position', render);
						$scope.$watch('object.rotation', render);

						$scope.$on('$destroy', function () {
							$scope.destroying = true;
							$($window).off('resize', bindOnResize);
							$scope.circuitBoardElement.css({
								WebkitTransform: 'none',
								MozTransform   : 'none',
								oTransform     : 'none',
								transform      : 'none'
							});
						});
					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {
					}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}])
	;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
})
;/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
