/**
 * @author Michiel Helvensteijn, http://www.mhelvens.net
 * Based on SharkViewer by Janelia:
 * https://github.com/JaneliaSciComp/SharkViewer
 */

THREE.SWCLoader = function (manager, parameters) {
	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
	this.sharkViewerParameters = parameters;
};

THREE.SWCLoader.prototype = {

	constructor: THREE.SWCLoader,

	load: function (url, onLoad/*, onProgress, onError*/) {
		var scope = this;
		var loader = new THREE.XHRLoader(scope.manager);
		loader.setCrossOrigin(this.crossOrigin);
		loader.load(url, function (text) {
			onLoad(scope.parse(text));
		});
	},

	parse: function (text) {

		//////////////////////////////////////////////////////////////////////////////////
		////////////////////////// Mostly Original SharkViewer Code //////////////////////
		//////////////////////////////////////////////////////////////////////////////////

		//Helper function to turn swc file data into json object
		function swc_parser(swc_file) {
			//split by lines
			var swc_ar = swc_file.split("\n");

			var float = '-?\\d*(?:\\.\\d+)?';
			var pattern = new RegExp('^\\s*(' + [
				'\\d+',   // index
				'[0-7]',  // type
				float,    // x
				float,    // y
				float,    // z
				float,    // radius
				'-1|\\d+' // parent
			].join(')\\s+(') + ')\\s*$');

			var swc_json = new Array(swc_ar.length);
			swc_ar.forEach(function (e) {
				//if line is good, put into json
				var match = e.match(pattern);
				if (match) {
					swc_json[parseInt(match[1])] = {
						'type'  : parseInt(match[2]),
						'x'     : parseFloat(match[3]),
						'y'     : parseFloat(match[4]),
						'z'     : parseFloat(match[5]),
						'radius': parseFloat(match[6]),
						'parent': parseInt(match[7])
					};
				}
			});
			return swc_json;
		}

		var SharkViewer = function (parameters) {
			/* swc neuron json object:
			*	{ id : {
			*		type: <type number of node (string)>,
			*		x: <x position of node (float)>,
			*		y: <y position of node (float)>,
			*		z: <z position of node (float)>,
			*		parent: <id number of node's parent (-1 if no parent)>,
			*		radius: <radius of node (float)>,
			*		}
			*	}
			*/
			this.swc = [];
			//mode (sphere, particle, skeleton)
			//this.mode = 'particle';
			this.mode = 'particle';
			//show cones between cylinders for particle and sphere mode
			this.show_cones = true;
			//color array, nodes of type 0 show as first color, etc.
			this.colors = [
				0x00be9e,
				0x3919cb,
				0x7d0bc4,
				0xff6700,
				0x3eef00,
				0xffce00,
				0xf50027,
				0x606060
			];
			this.setValues(parameters);
		};

		//generates sphere mesh
		SharkViewer.prototype.generateSphere = function (node) {
			var sphereMaterial = this.three_materials[ node.type ];
			var r1 = node.radius || 0.01;
			var geometry = new THREE.SphereGeometry(r1);
			var mesh = new THREE.Mesh(geometry, sphereMaterial);
			mesh.position.x = node.x;
			mesh.position.y = node.y;
			mesh.position.z = node.z;
			return mesh;
		};

		//generates cones connecting spheres
		SharkViewer.prototype.generateConeGeometry = function (node, node_parent) {
			var coneMaterial = this.three_materials[ node_parent.type ];
			var node_vec = new THREE.Vector3(node.x, node.y, node.z);
			var node_parent_vec = new THREE.Vector3(node_parent.x, node_parent.y, node_parent.z);
			var dist = node_vec.distanceTo(node_parent_vec);
			var cylAxis = new THREE.Vector3().subVectors(node_vec, node_parent_vec);
			cylAxis.normalize();
			var theta = Math.acos(cylAxis.y);
			var rotationAxis = new THREE.Vector3();
			rotationAxis.crossVectors(cylAxis, new THREE.Vector3(0, 1, 0));
			rotationAxis.normalize();
			var r1 = node.radius || 0.01;
			var r2 = node_parent.radius || 0.01;
			var geometry = new THREE.CylinderGeometry(r1, r2, dist);
			var mesh = new THREE.Mesh(geometry, coneMaterial);
			mesh.matrixAutoUpdate = false;
			mesh.matrix.makeRotationAxis(rotationAxis, -theta);
			var position = new THREE.Vector3((node.x + node_parent.x) / 2, (node.y + node_parent.y) / 2, (node.z + node_parent.z) / 2);
			mesh.matrix.setPosition(position);
			return mesh;
		};

		//generates particle vertices
		SharkViewer.prototype.generateParticle = function (node) {
			return new THREE.Vector3(node.x, node.y, node.z);
		};

		//generates skeleton vertices
		SharkViewer.prototype.generateSkeleton = function (node, node_parent) {
			var vertex = new THREE.Vector3(node.x, node.y, node.z);
			var vertex_parent = new THREE.Vector3(node_parent.x, node_parent.y, node_parent.z);
			return {
				'child' : vertex,
				'parent': vertex_parent
			};
		};

		//generates cone properties for node, parent pair
		SharkViewer.prototype.generateCone = function (node, node_parent) {
			var cone_child = {};
			var cone_parent = {};

			cone_child.vertex = new THREE.Vector3(node.x, node.y, node.z);
			cone_child.radius = node.radius;
			cone_child.color = this.nodeColor(node);

			cone_parent.vertex = new THREE.Vector3(node_parent.x, node_parent.y, node_parent.z);
			cone_parent.radius = node_parent.radius;
			cone_parent.color = this.nodeColor(node_parent);

			//normals
			var n1 = new THREE.Vector3().subVectors(cone_parent.vertex, cone_child.vertex);
			var n2 = n1.clone().negate();

			return {
				'child'  : cone_child,
				'parent' : cone_parent,
				'normal1': n1,
				'normal2': n2
			};
		};

		//calculates color based on node type
		SharkViewer.prototype.nodeColor = function (node) {
			if (node.type < this.three_colors.length) return this.three_colors[ node.type ];
			return this.three_colors[0];
		};

		SharkViewer.prototype.init = function () {
			var that = this;

			//set up shaders
			var vertexShader = [
				'uniform float particleScale;',
				'attribute float radius;',
				'attribute vec3 typeColor;',
				'varying vec3 vColor;',
				'varying vec4 mvPosition;',
				'void main() ',
				'{',
				'vColor = vec3(typeColor); // set RGB color associated to vertex; use later in fragment shader.',
				'mvPosition = modelViewMatrix * vec4(position, 1.0);',

				'// gl_PointSize = size;',
				'gl_PointSize = radius * ((particleScale*2.0) / length(mvPosition.z));',
				'gl_Position = projectionMatrix * mvPosition;',
				'}'
			].join("\n");

			var fragmentShader = [
				'#extension GL_EXT_frag_depth : enable',
				'uniform sampler2D sphereTexture; // Imposter image of sphere',
				'uniform mat4 projectionMatrix;',
				'varying vec3 vColor; // colors associated to vertices; assigned by vertex shader',
				'varying vec4 mvPosition;',
				'void main() ',
				'{',
				'// what part of the sphere image?',
				'vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);',
				'vec4 sphereColors = texture2D(sphereTexture, uv);',
				'// avoid further computation at invisible corners',
				'if (sphereColors.a < 0.3) discard;',

				'// calculates a color for the particle',
				'// gl_FragColor = vec4(vColor, 1.0);',
				'// sets a white particle texture to desired color',
				'// gl_FragColor = sqrt(gl_FragColor * texture2D(sphereTexture, uv)) + vec4(0.1, 0.1, 0.1, 0.0);',
				'// red channel contains colorizable sphere image',
				'vec3 baseColor = vColor * sphereColors.r;',
				'// green channel contains (white?) specular highlight',
				'vec3 highlightColor = baseColor + sphereColors.ggg;',
				'gl_FragColor = vec4(highlightColor, sphereColors.a);',
				'// TODO blue channel contains depth offset, but we cannot use gl_FragDepth in webgl?',
				'#ifdef GL_EXT_frag_depth',
				'// gl_FragDepthExt = 0.5;',
				'#endif',
				'}'
			].join("\n");

			var vertexShaderCone = [
				'attribute float radius;',
				'attribute vec3 typeColor;',
				'varying vec3 vColor;',
				'varying vec2 sphereUv;',
				'void main() ',
				'{',
				'	// TODO - offset cone position for different sphere sizes',
				'	// TODO - implement depth buffer on Chrome',
				'	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
				'	// Expand quadrilateral perpendicular to both view/screen direction and cone axis',
				'	vec3 cylAxis = (modelViewMatrix * vec4(normal, 0.0)).xyz; // convert cone axis to camera space',
				'	vec3 sideDir = normalize(cross(vec3(0.0,0.0,-1.0), cylAxis));',
				'	mvPosition += vec4(radius * sideDir, 0.0);',
				'	gl_Position = projectionMatrix * mvPosition;',
				'	// Pass and interpolate color',
				'	vColor = typeColor;',
				'	// Texture coordinates',
				'	sphereUv = uv - vec2(0.5, 0.5); // map from [0,1] range to [-.5,.5], before rotation',
				'	// If sideDir is "up" on screen, make sure u is positive',
				'	float q = sideDir.y * sphereUv.y;',
				'	sphereUv.y = sign(q) * sphereUv.y;',
				'	// rotate texture coordinates to match cone orientation about z',
				'	float angle = atan(sideDir.x/sideDir.y);',
				'	float c = cos(angle);',
				'	float s = sin(angle);',
				'	mat2 rotMat = mat2(',
				'		c, -s, ',
				'		s,  c);',
				'	sphereUv = rotMat * sphereUv;',
				'	sphereUv += vec2(0.5, 0.5); // map back from [-.5,.5] => [0,1]',
				'}'
			].join("\n");

			var fragmentShaderCone = [
				'uniform sampler2D sphereTexture; // Imposter image of sphere',
				'varying vec3 vColor;',
				'varying vec2 sphereUv;',
				'void main() ',
				'{',
				'	vec4 sphereColors = texture2D(sphereTexture, sphereUv);',
				'	if (sphereColors.a < 0.3) discard;',
				'	vec3 baseColor = vColor * sphereColors.r;',
				'	vec3 highlightColor = baseColor + sphereColors.ggg;',
				'	gl_FragColor = vec4(highlightColor, sphereColors.a);',
				'}'
			].join("\n");

			//set up colors and materials based on color array
			this.three_colors = [];
			this.three_materials = [];
			var color;
			for (color in this.colors) {
				if (this.colors.hasOwnProperty(color)) {
					this.three_colors.push(new THREE.Color(this.colors[color]));
					this.three_materials.push(new THREE.MeshBasicMaterial({ color: this.colors[color] }));
				}
			}

			//neuron is object 3d which ensures all components move together
			this.neuron = new THREE.Object3D();

			//particle mode uses vertex info to place texture image, very fast
			if (this.mode === 'particle') {

				//material = new THREE.ParticleSystemMaterial({color: 0x0080ff});
				// special imposter image contains:
				// 1 - colorizable sphere image in red channel
				// 2 - specular highlight in green channel
				// 3 - depth offset in blue channel (currently unused)
				var sphereImg = THREE.ImageUtils.loadTexture("patched-lib/SWCLoader/ComponentSphere.png");
				this.geometry = new THREE.Geometry();
				// properties that may vary from particle to particle. only accessible in vertex shaders!
				//	(can pass color info to fragment shader via vColor.)
				// compute scale for particles, in pixels
//

				var customAttributes = {
					radius   : { type: "fv1", value: [] },
					typeColor: { type: "c", value: [] }
				};

				this.swc.forEach(function (node) {
					var particle_vertex = that.generateParticle(node);
					that.geometry.vertices.push(particle_vertex);
					customAttributes.radius.value.push(node.radius);
					customAttributes.typeColor.value.push(that.nodeColor(node));
				});

				this.neuron.regenerateMaterial = function (height, fov) {
					var particleScale = (height && fov) ? 0.5 * height / Math.tan(0.5 * fov * Math.PI / 180.0) : 1;
					var customUniforms = {
						particleScale: { type: 'f', value: particleScale },
						sphereTexture: { type: 't', value: sphereImg }
					};
					that.material = new THREE.ShaderMaterial({
						uniforms      : customUniforms,
						attributes    : customAttributes,
						vertexShader  : vertexShader,
						fragmentShader: fragmentShader,
						transparent   : true,
						depthTest     : true
					});
					that.neuron.material = that.material;
				};
				this.neuron.regenerateMaterial();


				var particles = new THREE.ParticleSystem(this.geometry, this.material);
				particles.sortParticles = false;
				this.neuron.add(particles);

				if (this.show_cones) {
					// Cone quad imposters, to link spheres together
					var coneAttributes = {
						radius   : { type: "fv1", value: [] },
						typeColor: { type: "c", value: [] }
					};
					var coneUniforms = {
						sphereTexture: { type: 't', value: sphereImg }
					};
					var uvs = [
						new THREE.Vector2(0.5, 0),
						new THREE.Vector2(0.5, 1),
						new THREE.Vector2(0.5, 1)
					];
					var coneGeom = new THREE.Geometry();
					this.swc.forEach(function (node) {
						if (node.parent !== -1) {
							// Child/first position
							var cone = that.generateCone(node, that.swc[node.parent]);
							var ix2 = coneGeom.vertices.push(cone.child.vertex);
							coneAttributes.radius.value.push(cone.child.radius);
							coneAttributes.typeColor.value.push(cone.child.color);

							coneGeom.vertices.push(cone.parent.vertex);
							coneAttributes.radius.value.push(cone.parent.radius);
							coneAttributes.typeColor.value.push(cone.parent.color);

							// Paint two triangles to make a cone-imposter quadrilateral
							// Triangle #1
							var coneFace = new THREE.Face3(ix2 - 1, ix2 - 1, ix2);
							coneFace.vertexNormals = [ cone.normal1, cone.normal2, cone.normal2 ];
							coneGeom.faces.push(coneFace);
							// Simple texture coordinates should be modified in the vertex shader
							coneGeom.faceVertexUvs[0].push(uvs);
							// Triangle #2
							coneFace = new THREE.Face3(ix2, ix2, ix2 - 1);
							coneFace.vertexNormals = [ cone.normal1, cone.normal2, cone.normal1 ];
							coneGeom.faces.push(coneFace);
							coneGeom.faceVertexUvs[0].push(uvs);
						}
					});
					var coneMaterial = new THREE.ShaderMaterial(
							{
								attributes    : coneAttributes,
								uniforms      : coneUniforms,
								vertexShader  : vertexShaderCone,
								fragmentShader: fragmentShaderCone,
								transparent   : false,
								depthTest     : true,
								side          : THREE.DoubleSide
							});
					var coneMesh = new THREE.Mesh(coneGeom, coneMaterial);
					this.neuron.add(coneMesh);
				}
			} else if (this.mode === 'sphere') {
				this.swc.forEach(function (node) {
					var sphere = that.generateSphere(node);
					that.neuron.add(sphere);
					if (that.show_cones) {
						if (node.parent !== -1) {
							var cone = that.generateConeGeometry(node, that.swc[node.parent]);
							that.neuron.add(cone);
						}
					}
				});
			} else if (this.mode === 'skeleton' || this.show_cones === false) {
				this.material = new THREE.LineBasicMaterial({ color: this.colors[this.colors.length - 1] });
				if (this.mode === 'skeleton') this.material.color.set(this.colors[0]);
				this.geometry = new THREE.Geometry();
				this.swc.forEach(function (node) {
					if (node.parent !== -1) {
						var vertices = that.generateSkeleton(node, that.swc[node.parent]);
						that.geometry.vertices.push(vertices.child);
						that.geometry.vertices.push(vertices.parent);
					}
				});
				var line = new THREE.Line(this.geometry, this.material, THREE.LinePieces);
				this.neuron.add(line);
			}

//			this.neuron.position.set(-this.center[0], -this.center[1], -this.center[2]);

		};

		//sets up user specified configuration
		SharkViewer.prototype.setValues = function (values) {
			if (values === undefined) return;
			for (var key in values) {
				if (values.hasOwnProperty(key)) {
					if (values[key] !== undefined && key in this) {
						this[key] = values[key];
					}
				}
			}
		};

		//////////////////////////////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////////////////////////////

		var params = this.sharkViewerParameters || {};
		params.swc = swc_parser(text);
		var s = new SharkViewer(params);
		s.init();
		return s.neuron;
	}

};