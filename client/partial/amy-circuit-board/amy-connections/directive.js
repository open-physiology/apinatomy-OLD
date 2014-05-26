'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'app/module'], function (ng, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	app.directive('amyConnections', ['$bind', function ($bind) {
		return {
			restrict:    'A',
			scope:       true,
			controller: ['$scope', function ($scope) {
				$scope.circuitBoard.graphLayer.then.graphLayer.then(function (graphLayer) {
					var graphGroup = graphLayer.newGraphGroup();


					//////////////////// Proteins //////////////////////////////////////////////////////

					function addAllEdgesAndVertices() {
						$scope.entity._promise.then(function () {
							var proteinArtefactMap = {};
							_($scope.entity.proteins).forEach(function (protein) {
								//// generate the svg element for the protein
								//
								var smallMoleculeIndicator = '';
								if (!_(protein.smallMoleculeInteractions).isUndefined() && protein.smallMoleculeInteractions.length > 0) {
									smallMoleculeIndicator = '<circle class="small-molecule-indicator" r="9"></circle>';
								}
								var element = $('<svg class="protein vertex-wrapper">' + '<circle class="core" r="4.5"></circle>' +
								                smallMoleculeIndicator + '</svg>');

								//// create the protein artefact
								//
								var proteinArtefact = new artefacts.Protein({
									parent:            $scope.tile,
									element:           element[0],
									protein:           protein,
									detailTemplateUrl: 'partial/amy-circuit-board/amy-tile/protein-detail-view.html',
									ResourceService:   ResourceService
								});
								proteinArtefactMap[protein._id] = proteinArtefact;

								//// add the protein artefact to the graph group
								//
								graphGroup.addVertex(proteinArtefact);

								//// react to mouse hover by giving focus
								//
								element.on('mouseover', $bind(function (event) {
									event.stopPropagation();
									$scope.$root.$broadcast('artefact-focus', proteinArtefact, {});
								}));
								element.on('mouseout', $bind(function (event) {
									event.stopPropagation();
									$scope.$root.$broadcast('artefact-unfocus', proteinArtefact, {});
								}));

								//// react to clicks by fixing focus
								//
								element.clickNotDrop($bind(function () {
									$scope.$root.$broadcast('artefact-focus-fix',
											proteinArtefact.focusFixed ? null : proteinArtefact);
								}));

								//// react to dragging by temporarily fixing focus (if not already fixed)
								//
								var removeFocusFixOnDrop;
								element.mouseDragDrop($bind(function () {
									if (proteinArtefact.focusFixed) {
										removeFocusFixOnDrop = false;
									} else {
										removeFocusFixOnDrop = true;
										$scope.$root.$broadcast('artefact-focus-fix', proteinArtefact);
									}
								}), $bind(function () {
									if (removeFocusFixOnDrop) {
										$scope.$root.$broadcast('artefact-focus-fix', null);
									}
								}));

								//// how to react when focus is fixed:
								//
								$scope.$on('artefact-focus-fix', function (e, artefact) {
									proteinArtefact.focusFixed = (artefact === proteinArtefact);
									element.setSvgClass('focus-fixed', proteinArtefact.focusFixed);
								});
							});

							_($scope.entity.proteinInteractions).forEach(function (interaction) {
								// NOTE: an svg element is added and immediately discarded
								//       to fix a strange bug that otherwise leaves edges invisible
								var element = $('<svg><line class="protein-interaction" stroke="purple"></line></svg>').children();
								graphGroup.addEdge({
									id: 'ppi:(' + interaction.interaction[0] + ',' + interaction.interaction[1] + ')',
									source:  proteinArtefactMap[interaction.interaction[0]],
									target:  proteinArtefactMap[interaction.interaction[1]],
									element: element[0]
								});
							});

						});
					}

					function removeAllEdgesAndVertices() {
						_(graphGroup.vertices()).forEach(function (proteinArtefact) {
							if (proteinArtefact.focusFixed) {
								$scope.$root.$broadcast('artefact-focus-fix', null);
							}
							proteinArtefact.destructor();
						});
						graphGroup.removeAllEdgesAndVertices();
					}

					$scope.$watch('tile.position', function (newPosition) {
						if (newPosition) { setRegion(); }
					});

					$scope.$watch('tile.open', function (isOpen, wasOpen) {
						if (wasOpen !== isOpen) { setRegion(); }
					});

					$scope.$watch('tile.active && $root.proteinsEnabled', function (showProteins) {
						if (showProteins) {
							addAllEdgesAndVertices();
						} else {
							removeAllEdgesAndVertices();
						}
					});

					$scope.$on('$destroy', function () {
						removeAllEdgesAndVertices();
					});

				});
			}]
		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
