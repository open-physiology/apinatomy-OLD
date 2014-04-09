'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash',
	'angular',
	'app/module',
	'threejs',
	'threejs-obj-loader',
	'threejs-css-3d-renderer',
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
				circuitBoardElement: '='
			},

			controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						function init() {

							//////////////////// how to transform an object in sync with the circuitboard //////////////

							function transformWithCircuitboard(obj) {
								$scope.$watch('transformation', function (transformation) {
									obj.position.x = .24 * transformation.translate.x;
									obj.position.y = .24 * transformation.translate.y;
									obj.position.z = .24 * transformation.translate.z;

									obj.rotation.x = -transformation.rotate.x * DEG_TO_RAD;
									obj.rotation.y = -transformation.rotate.y * DEG_TO_RAD;
									obj.rotation.z = -transformation.rotate.z * DEG_TO_RAD;

									render();
								});
							}


							//////////////////// camera ////////////////////

							$scope.camera = new THREE.PerspectiveCamera(60, iElement.width() / iElement.height(), 1, 10000);
							$scope.camera.position.z = iElement.height() / (2 * Math.tan($scope.camera.fov * DEG_TO_RAD / 2));

							//////////////////// scene ////////////////////

							$scope.scene = new THREE.Scene();

							//////////////////// lighting ////////////////////

							var ambientLight = new THREE.AmbientLight(0x101030);
							$scope.scene.add(ambientLight);

							var directionalLight = new THREE.DirectionalLight(0xffeedd);
							directionalLight.position.set(0, 0, 1);
							$scope.scene.add(directionalLight);

							//////////////////// loading manager ////////////////////

							var manager = new THREE.LoadingManager();

							//////////////////// TEST: Loading HTML circuitboard ///////////////////

							(function () {
//								var material = new THREE.MeshBasicMaterial({ color: '#000000', wireframe: true });
//								var geometry = new THREE.PlaneGeometry(iElement.width(), iElement.height(), 30, 30);
//								var planeMesh= new THREE.Mesh( geometry, material );
//
//								$scope.scene.add(planeMesh);
//
//								transformWithCircuitboard(planeMesh);

								var circuitBoard = new THREE.CSS3DObject($scope.circuitBoardElement[0]);

								$scope.circuitBoardElement.css({
									width : iElement.width(),
									height: iElement.height()
								});

								$scope.scene.add(circuitBoard);

								transformWithCircuitboard(circuitBoard);
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

								transformWithCircuitboard($scope.object);
							}));

							//////////////////// renderer ////////////////////

							$scope.renderer = new THREE.WebGLRenderer({ alpha: true });
							$scope.renderer.setSize(iElement.width(), iElement.height());

							$scope.cssRenderer = new THREE.CSS3DRenderer();
							$scope.cssRenderer.setSize(iElement.width(), iElement.height());
							$($scope.cssRenderer.domElement).append($scope.renderer.domElement);

							iElement.append($scope.cssRenderer.domElement);

						}

						//// the function that actually renders the scene:

						function render() {
							$scope.camera.lookAt($scope.scene.position);
							$scope.renderer.render($scope.scene, $scope.camera);
							$scope.cssRenderer.render($scope.scene, $scope.camera);
						}

						//// start doing stuff

						init();
						render();

						//// reacting to window resize

						$($window).on('resize', $bind(function () {
							//// update the camera

							$scope.camera.aspect = iElement.width() / iElement.height();
							$scope.camera.updateProjectionMatrix();
							$scope.camera.position.z = iElement.height() / (2 * Math.tan($scope.camera.fov * DEG_TO_RAD / 2));

							//// update the renderer

							$scope.renderer.setSize(iElement.width(), iElement.height());
							$scope.cssRenderer.setSize(iElement.width(), iElement.height());

							//// update the circuit-board

							$scope.circuitBoardElement.css({
								width : iElement.width(),
								height: iElement.height()
							});

							//// and render

							render();
						}));

						$scope.$watch('object.position', render);
						$scope.$watch('object.rotation', render);

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
