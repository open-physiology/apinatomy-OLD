'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular',
	'app/module',
	'chroma',
	'lodash',
	'partial/icon-btn/directive',
	'resource/service',
	'$bind/service'], function (ng, app, color, _) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyTile', ['$bind', 'ResourceService', 'RecursionHelper', 'defaults', function ($bind, Resources, RecursionHelper, defaults) {


		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////


		var generateTileDefaults = defaults({
			normal: {
				css: {
					'&'                       : {
						backgroundColor: " bgColor                                                                           ",
						borderColor    : " color(`.normal.css['&'].backgroundColor`).brighten(20).css()                      ",
						color          : " color(`.normal.css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' ",
						borderWidth    : " '1px' "
					},
					'& > header'              : {
						borderColor: " `.normal.css['&'].borderColor` ",
						borderWidth: " `.normal.css['&'].borderWidth` "
					},
					'& > header.full icon-btn': {
						display: " 'none' ",
						color  : " `.normal.css['&'].color` "
					},
					'& > section'             : " {} "
				}
			},
			focus : {
				css: {
					'&'                       : {
						backgroundColor: " color(`.normal.css['&'].backgroundColor`).brighten(40).css()                      ",
						borderColor    : " color(`.normal.css['&'].borderColor`).darken(40).css()                            ",
						color          : " color(`.focus .css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' ",
						borderWidth    : " `.normal.css['&'].borderWidth` "
					},
					'& > header'              : {
						borderColor: " `.focus.css['&'].borderColor` ",
						borderWidth: " `.focus.css['&'].borderWidth` "
					},
					'& > header.full icon-btn': {
						display: " 'initial' ",
						color  : " `.focus.css['&'].color` "
					},
					'& > section'             : " `.normal.css['& > section']` "
				}
			}
		});


		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////


		return {
			restrict   : 'E',
			replace    : true,
			templateUrl: 'partial/amy-tile-map/tile/view.html',
			require    : 'ngModel',
			scope      : true,

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function (dElement) {
				return RecursionHelper.compile(dElement, {

					pre: function preLink($scope, iElement, iAttrs, ngModel) {
						iElement.attr('amy-tile', '');

						//////////////////// Getting the model value ///////////////////////////////////////////////////

						ngModel.$render = function () {
							$scope.subEntity = ngModel.$modelValue;

							//////////////////// Tile / Artefact Hierarchy /////////////////////////////////////////////

							$scope.tile =
							$scope.artefact = {
								id          : $scope.$id,
								type        : 'tile',
								show        : true,

								//// artefact hierarchy:
								parent      : $scope.$parent.artefact,
								relationType: $scope.subEntity.type,
								children    : [],
								root        : $scope.$parent.artefact.root,

								//// entity:
								entity      : $scope.subEntity.entity,
								active      : true, // only one active tile per entity; TODO

								//// state:
								mouseOver   : false,
								state       : 'normal',

								//// properties:
								open        : false,
								maximized   : false,
								hidden      : false,

								//// 3D-model related properties:
								has3DModel  : false,
								show3DModel : false
							};

							$scope.artefact.parent.children.push($scope.artefact);


							//////////////////// Tile Weight ///////////////////////////////////////////////////////////

							_($scope.tile).derivedProperty('weight', function () {
								if ($scope.tile.maximized) {
									return Infinity;
								}
								else if ($scope.tile.open) {
									return 8;
								}
								else if ($scope.tile.hidden) {
									return 0;
								}
								else {
									return 1;
								}
							});


							//////////////////// Reacting to Mouse-over ////////////////////////////////////////////////

							$scope.onMouseEnter = function (/*$event*/) {
								$scope.tile.mouseOver = true;
								$scope.$root.$broadcast('artefact-focus', $scope.tile);
							};

							$scope.onMouseLeave = function (/*$event*/) {
								$scope.tile.mouseOver = false;
								$scope.$root.$broadcast('artefact-unfocus', $scope.tile);
							};

							$scope.onHeaderClick = function (/*$event*/) {
								$scope.tile.open = !$scope.tile.open;
							};

							$scope.tile.entity._promise.then(function () {

								//////////////////// Tile Styling //////////////////////////////////////////////////////

								//// calculate styling, possibly based on parent tile background

								if (($scope.tile.parent.parent.type === 'tile')) {
									var parentBgColor = $scope.tile.parent.parent.styling.normal.css['&'].backgroundColor;
									$scope.tile.styling = generateTileDefaults($scope.tile.entity.tile, {
										bgColor: (color(parentBgColor).luminance() < .5 ?
												color(parentBgColor).brighten(30).css() :
												color(parentBgColor).darken(30).css() )
									});
								} else {
									$scope.tile.styling = generateTileDefaults($scope.tile.entity.tile, {
										bgColor: '#eeeeee'
									});
								}

								//// applying styling to the tile

								function applyTileStyling() {
									iElement.putCSS($scope.tile.styling[$scope.tile.state].css);
								}

								//// do it now

								applyTileStyling();

								//// dynamically applying the right CSS to the tile

								$scope.$watch("tile.open", function (isOpen, wasOpen) {
									if (isOpen !== wasOpen) {
										applyTileStyling();
									}
								});
								$scope.$watch('tile.state', function (newState, oldState) {
									if (newState !== oldState) {
										applyTileStyling();
									}
								});


								//////////////////// Hover to set focus ////////////////////////////////////////////////

								$scope.$on('artefact-focus', function (event, artefact) {
									$scope.tile.state = (artefact.entity && artefact.entity === $scope.tile.entity)
											? 'focus'
											: 'normal';
								});

								$scope.$on('artefact-unfocus', function (event, artefact) {
									if (artefact.entity && artefact.entity === $scope.tile.entity) {
										$scope.tile.state = 'normal';
									}
								});

							}); // $scope.tile.entity._promise.then
						}

					},

					post: function () {
					}

				});
			}

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

		};
	}])
	;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
