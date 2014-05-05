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


	app.directive('amyCircuitBoardTile', ['$bind', 'ResourceService', 'RecursionHelper', 'defaults', '$timeout', '$window', function ($bind, Resources, RecursionHelper, defaults, $timeout, $window) {


		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////


		var generateTileDefaults = defaults({
			normal: {
				css:     {
					'&':                        {
						backgroundColor: " bgColor                                                                           ",
						borderColor:     " color(`.normal.css['&'].backgroundColor`).brighten(20).css()                      ",
						color:           " color(`.normal.css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' ",
						borderWidth:     " '1px' "
					},
					'& > header':               {
						borderColor: " `.normal.css['&'].borderColor` ",
						borderWidth: " `.normal.css['&'].borderWidth` "
					},
					'& > header.full icon-btn': {
						display: " 'none' ",
						color:   " `.normal.css['&'].color` "
					},
					'& > section':              " {} "
				},
				layout:  " 'rowsOfTiles' ",
				spacing: " 2 "
			},
			focus:  {
				css:     {
					'&':                        {
						backgroundColor: " color(`.normal.css['&'].backgroundColor`).brighten(40).css()                      ",
						borderColor:     " color(`.normal.css['&'].borderColor`).darken(40).css()                            ",
						color:           " color(`.focus .css['&'].backgroundColor`).luminance() > 0.5 && 'black' || 'white' ",
						borderWidth:     " `.normal.css['&'].borderWidth` "
					},
					'& > header':               {
						borderColor: " `.focus.css['&'].borderColor` ",
						borderWidth: " `.focus.css['&'].borderWidth` "
					},
					'& > header.full icon-btn': {
						display: " 'initial' ",
						color:   " `.focus.css['&'].color` "
					},
					'& > section':              " `.normal.css['& > section']` "
				},
				layout:  "`.normal.layout`",
				spacing: "`.normal.spacing`"
			}
		});


		var generateTileMapDefaults = defaults({
			layout:  " 'rowsOfTiles' ",
			spacing: " 2 "
		});


		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////


		return {
			restrict:    'E',
			replace:     true,
			templateUrl: 'partial/circuit-board/tile/view.html',
			scope:       {
				subEntity: '='
			},

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			controller: ['$scope', function ($scope) {

				//////////////////// Tile / Artefact Hierarchy /////////////////////////////////////////////////////////

				$scope.tile =
				$scope.artefact = {
					id:           $scope.$id,
					type:         'tile',

					//// artefact hierarchy:
					parent:       $scope.$parent.artefact,
					relationType: $scope.subEntity.type,
					children:     [],
					root:         $scope.$parent.artefact.root,

					//// entity:
					entity:       $scope.subEntity.entity,

					//// state:
					mouseOver:    false,
					state:        'normal',

					//// properties:
					open:         false,
					maximized:    false,
					weight:       1,

					//// 3D-model related properties:
					has3DModel:   false,
					show3DModel:  false
				};

				$scope.artefact.parent.children.push($scope.artefact);


				//////////////////// Reacting to Mouse-over ////////////////////////////////////////////////////////////

				$scope.onMouseEnter = function (/*$event*/) {
					$scope.tile.mouseOver = true;
					$scope.$root.$broadcast('artefact-focus', $scope.tile);
				};

				$scope.onMouseLeave = function (/*$event*/) {
					$scope.tile.mouseOver = false;
					$scope.$root.$broadcast('artefact-unfocus', $scope.tile);
				};

			}],

			////////////////////////////////////////////////////////////////////////////////////////////////////////////
			////////////////////////////////////////////////////////////////////////////////////////////////////////////

			compile: function (dElement) {
				return RecursionHelper.compile(dElement, {

					pre: function preLink($scope, iElement/*, iAttrs, controller*/) {
						$scope.tile.entity._promise.then(function () {

							//////////////////// Tile Styling //////////////////////////////////////////////////////////

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


							//////////////////// Tile-map Styling //////////////////////////////////////////////////////

							$scope.tileMapStyling = generateTileMapDefaults($scope.tile.entity.tileMap);


							//////////////////// Hover to set focus ////////////////////////////////////////////////////

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


						});
					},

					post: function postLink(/*$scope, iElement, iAttrs, controller*/) {}

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
