'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['lodash',
	'angular',
	'app/module',
	'threejs',
	'threejs-obj-loader',
	'$bind/service',
	'defaults/service'
], function (_, ng, app, THREE) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var DEG_TO_RAD = Math.PI / 180;


	app.directive('amyCanvas', ['$window', '$bind', function ($window, $bind) {
		return {

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			restrict: 'E',
			replace : false,
			scope   : {
				transformation: '=amyTransformation'
			},

			controller: ['$scope', '$rootScope', function ($scope, $rootScope) {}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function () {
				return {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {

						function init() {

							//// camera

							$scope.camera = new THREE.PerspectiveCamera(45, iElement.width() / iElement.height(), 1, 600);
							$scope.camera.position.z = 200;

							//// scene

							$scope.scene = new THREE.Scene();

							//// lighting

							var ambientLight = new THREE.AmbientLight(0x101030);
							$scope.scene.add(ambientLight);

							var directionalLight = new THREE.DirectionalLight(0xffeedd);
							directionalLight.position.set(0, 0, 1);
							$scope.scene.add(directionalLight);

							//// loading manager

							var manager = new THREE.LoadingManager();

							//// loading the .obj file

							var objLoader = new THREE.OBJLoader(manager);
							objLoader.load('partial/circuitboard/threed/example/bust.obj', $bind(function (obj) {
								$scope.object = obj;
								$scope.scene.add($scope.object);
								$scope.object.scale.set(15, 15, 15);
								$scope.object.eulerOrder = 'XYZ';



								$scope.$watch('transformation', function (transformation) {
									$scope.object.position.x = .19 * transformation.translate.x;
									$scope.object.position.y = .19 * transformation.translate.y;
									$scope.object.position.z = .19 * transformation.translate.z;

									$scope.object.rotation.x = -transformation.rotate.x * DEG_TO_RAD;
									$scope.object.rotation.y = -transformation.rotate.y * DEG_TO_RAD;
									$scope.object.rotation.z = -transformation.rotate.z * DEG_TO_RAD;

									render();
								});

							}));

							//// renderer

							$scope.renderer = new THREE.WebGLRenderer({ alpha: true });
							$scope.renderer.setSize(iElement.width(), iElement.height());
							iElement.append($scope.renderer.domElement);

						}

						//// the function that actually renders the scene:

						function render() {
							$scope.camera.lookAt($scope.scene.position);
							$scope.renderer.render($scope.scene, $scope.camera);
						}

						//// start doing stuff

						init();
						render();

						//// reacting to window resize

						$($window).on('resize', $bind(function () {
							$scope.camera.aspect = iElement.width() / iElement.height();
							$scope.camera.updateProjectionMatrix();
							$scope.renderer.setSize(iElement.width(), iElement.height());
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
