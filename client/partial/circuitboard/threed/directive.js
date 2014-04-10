'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash',
	'angular',
	'app/module',
	'threejs',
	'threejs-obj-loader',
	'threejs-css-3d-renderer',
	'threejs-trackball-controls',
	'$bind/service',
	'defaults/service'
], function (_, ng, app, THREE) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var DEG_TO_RAD = Math.PI / 180;

	var URI_TO_MODEL = {
		'fma:7148' : 'partial/circuitboard/threed/models/FMA7148_Stomach.obj',
		'fma:7197' : 'partial/circuitboard/threed/models/FMA7197_Liver.obj',
		'fma:7204' : 'partial/circuitboard/threed/models/FMA7204_Right_Kidney.obj',
		'fma:7205' : 'partial/circuitboard/threed/models/FMA7205_Left_Kidney.obj',
		'fma:7394' : 'partial/circuitboard/threed/models/FMA7394_Trachea.obj',
		'fma:12513': 'partial/circuitboard/threed/models/FMA12513_Eyeball.obj',
		'fma:13076': 'partial/circuitboard/threed/models/FMA13076_Fifth_Lumbar_Vertebra.obj',
		'fma:24498': 'partial/circuitboard/threed/models/FMA24498_Left_Calcaneus.obj',
		'fma:52735': 'partial/circuitboard/threed/models/FMA52735_Occipital_Bone.obj',
		'fma:52748': 'partial/circuitboard/threed/models/FMA52748_Mandible.obj',
		'fma:62004': 'partial/circuitboard/threed/models/FMA62004_Medulla_Oblongata.obj'
	};


	app.directive('amyCanvas', ['$window', '$bind', function ($window, $bind) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			replace : false,
			scope   : {
				transformation     : '=amyTransformation',
				margin             : '=amyMargin',
				circuitBoardElement: '='
			},

			controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
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

							var directionalLight = new THREE.DirectionalLight(0xffeedd);
							directionalLight.position.set(1, -1, 1);
							$scope.scene.add(directionalLight);

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

								$scope.scene.add($scope.circuitBoard);

								$scope.backfaceElement = $('<div></div>');
								$scope.backface = new THREE.CSS3DObject($scope.backfaceElement[0]);
								$scope.backfaceElement.css({
									position: 'absolute',
									width : iElement.width() - $scope.margin.left - $scope.margin.right,
									height: iElement.height() - $scope.margin.top - $scope.margin.bottom,
									border: 'solid 1px black',
									backfaceVisibility: 'hidden'
								});
								$scope.backface.rotation.set(Math.PI, 0, 0);
								$scope.backface.position.x = $scope.margin.left / 2 - $scope.margin.right / 2;
								$scope.backface.position.y = $scope.margin.top  / 2 - $scope.margin.bottom / 2;

								$scope.scene.add($scope.backface);

							}());

							//////////////////// loading the .obj file ////////////////////

							var objLoader = new THREE.OBJLoader(manager);
							objLoader.load(URI_TO_MODEL['fma:52748'], $bind(function (obj) {
								$scope.object = obj;

								//// Normalize position and size

								var boundingSphere = $scope.object.children[0].geometry.boundingSphere;
								var translation = boundingSphere.center.negate();
								$scope.object.children[0].geometry.applyMatrix(new THREE.Matrix4().setPosition(translation));
								var scalingFactor = 100 / boundingSphere.radius;
								$scope.object.children[0].geometry.applyMatrix(new THREE.Matrix4().makeScale(scalingFactor, scalingFactor, scalingFactor));

								//// Add to scene

								$scope.scene.add($scope.object);

								$scope.object.children[0].position.z = 150;
								$scope.object.position.x = $scope.margin.left / 2 - $scope.margin.right / 2;
								$scope.object.position.y = $scope.margin.top / 2 - $scope.margin.bottom / 2;
							}));

							//////////////////// renderer ////////////////////

							$scope.renderer = new THREE.WebGLRenderer({ alpha: true });
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

						function animateByControls() {
							requestAnimationFrame(animateByControls);
							$scope.controls.update();
						}

						//// the function that actually renders the scene:

						function render() {
							$scope.renderer.render($scope.scene, $scope.camera);
							$scope.cssRenderer.render($scope.scene, $scope.camera);
						}

						//// start doing stuff

						init();
						render();
						animateByControls();

						//// reacting to window resize

						function onResize() {
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
							$scope.backface.position.y = $scope.margin.top  / 2 - $scope.margin.bottom / 2;

							//// update the 3D model positions; TODO: adjust to multiple unknown models

							if ($scope.object) {
								$scope.object.position.x = $scope.margin.left / 2 - $scope.margin.right / 2;
								$scope.object.position.y = $scope.margin.top / 2 - $scope.margin.bottom / 2;
							}

							//// update controls

							$scope.controls.handleResize();

							//// and render

							render();
						}

						//// react to events

						var bindOnResize = $bind(onResize);
						$($window).on('resize', bindOnResize);
						$scope.$on('$destroy', function () { $($window).off('resize', bindOnResize); });

						$scope.$watch('margin', onResize);

						$scope.$watch('object.position', render);
						$scope.$watch('object.rotation', render);

					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}

				};
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
