var W = window.innerWidth
var H = window.innerHeight

// MAIN SCENE
var camera = new THREE.PerspectiveCamera( 75, W / H, 1, 100000 );
camera.position.z = 2000;
var scene = new THREE.Scene();

// OCCLUSION RENDERER
var oclscene = new THREE.Scene();
var oclrenderer,oclcamera,vlight

oclrenderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer : true});
oclrenderer.gammaInput = true;
oclrenderer.gammaOutput = true;
oclrenderer.setSize( W, H);
document.body.appendChild(oclrenderer.domElement);
oclrenderer.domElement.id = "occlusion"
oclrenderer.setClearColor( 0x000000, 1);
oclrenderer.autoClear = false

oclcamera = new THREE.PerspectiveCamera( 75, W / H, 1, 100000 );
oclcamera.position.z = 2000;

oclscene.add( new THREE.AmbientLight( 0xffffff ) );

// Volumetric light

vlight = new THREE.Mesh(
    new THREE.IcosahedronGeometry(350, 3),
    new THREE.MeshBasicMaterial({
        color: 0xebe2bd
    })
);

vlight.position.z = 0;
oclscene.add(vlight);
scene.add(vlight.clone());

var texloader = new THREE.TextureLoader();
var tex = texloader.load("img/rabbithole.png" );



var texloader2 = new THREE.TextureLoader();
var tex2 = texloader2.load("img/space_spherical_map_by_cesium135-d5qay53.jpg" );
var texmat = new THREE.MeshBasicMaterial( {
	map: tex2,
	opacity:1,
	side:THREE.DoubleSide,
	depthTest:true
})

var texmesh = new THREE.Mesh(new THREE.IcosahedronGeometry(8000,3),texmat);
texmesh.position.z = -1200
scene.add(texmesh)

var mat1 = new THREE.MeshLambertMaterial({ 
	map: tex, 
	transparent:true, opacity:1, side:THREE.DoubleSide
});
	
var geometry = new THREE.BoxGeometry( 1000, 1000, 1000 );
var mesh = new THREE.Mesh( geometry, mat1 );
meshes = createScene( geometry,mat1, 0, 0, 0, 0 )

var renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: true };
renderTargetOcl = new THREE.WebGLRenderTarget( W, H, renderTargetParameters );

var bluriness = 2;
hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
vblur = new THREE.ShaderPass( THREE.VerticalBlurShader );
hblur.uniforms.h.value = bluriness / W;
vblur.uniforms.v.value = bluriness / H;

var renderModel = new THREE.RenderPass( scene, oclcamera );
var renderModelOcl = new THREE.RenderPass( oclscene, oclcamera);

var grPass = new THREE.ShaderPass( THREE.Extras.Shaders.Godrays );
grPass.needsSwap = true;
grPass.renderToScreen = false;

var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
effectCopy.renderToScreen = true;

effectSave2 = new THREE.SavePass( new THREE.WebGLRenderTarget( W, H, renderTargetParameters ) );

var oclcomposer = new THREE.EffectComposer( oclrenderer, renderTargetOcl );


// render the occlude scene
oclcomposer.addPass( renderModelOcl );

// remove color to leaver alpha only
var effectSave1 = new THREE.SavePass( new THREE.WebGLRenderTarget( W, H, renderTargetParameters ) )
//oclcomposer.addPass( effectSave1 );
var removecolorPass = new THREE.ShaderPass( THREE.Extras.Shaders.Alpha );
removecolorPass.uniforms['tAdd'].value = effectSave1.renderTarget;
removecolorPass.needsSwap = true;
//oclcomposer.addPass( removecolorPass );

// blur,blur,blur,blur, godrays
oclcomposer.addPass( hblur );
oclcomposer.addPass( vblur );
oclcomposer.addPass( hblur );
oclcomposer.addPass( vblur );
oclcomposer.addPass( grPass );

// save god rays
oclcomposer.addPass( effectSave2 );

// render the actual scene
oclcomposer.addPass( renderModel );

// final pass to add godrays 
var finalPass = new THREE.ShaderPass( THREE.Extras.Shaders.Additive );
finalPass.uniforms['tAdd'].value = effectSave2.renderTarget;
finalPass.needsSwap = true;
finalPass.renderToScreen = true;
oclcomposer.addPass( finalPass );

function createScene( geometry, material, x, y, z, b ) {
	zmesh = new THREE.Mesh( geometry, material );
	zmesh.position.set( x, y, z );
	scene.add( zmesh );
	//var gmat = new THREE.MeshBasicMaterial( { color: 0x000000, map: null} );
	var geometryClone = geometry.clone(); //THREE.GeometryUtils.clone( geometry );
	var gmesh = new THREE.Mesh(geometryClone, material);
	gmesh.position.set( x, y, z );
	oclscene.add(gmesh);
	return Array(zmesh,gmesh);
}

var orbitControls = new THREE.OrbitControls(oclcamera);
orbitControls.autoRotate = false;
var clock = new THREE.Clock();
var i = 0, j = Math.PI/400;


function render() {
 	var delta = clock.getDelta();
	orbitControls.update(delta);
    
    var pos = THREE.Extras.Utils.projectOnScreen(vlight, oclcamera);
	grPass.uniforms.fX.value = pos.x;
	grPass.uniforms.fY.value = pos.y;
	i+=j;
	oclcomposer.render(delta)
    meshes[0].rotation.y += 0.0023
    meshes[1].rotation.y += 0.0023
    texmesh.rotation.y -= 0.0013
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

animate();