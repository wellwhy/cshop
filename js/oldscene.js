document.onmousemove = updateMousePos;
var startingWidth = window.innerWidth;
var clock = new THREE.Clock();
var scene = new THREE.Scene();
var fractalscene = new THREE.Scene();
var container = document.getElementById("three_js_container_1");
var camera = new THREE.PerspectiveCamera( 70, container.offsetWidth/container.offsetHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({container,alpha: true,antialias:true});
renderer.setPixelRatio( .25 );
renderer.setClearColor( 0x000000, 0 ); 
var loader = new THREE.GLTFLoader();
var light = new THREE.HemisphereLight( 0x000000, 0xffffff, 1.5 );
renderer.gammaOutput = true;
scene.add( light );
fractalscene.add ( light );


var video = document.getElementById("videotexture");
// video.play();
var texture =new THREE.VideoTexture( video );
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.format = THREE.RGBFormat;
var parameters = { color: 0xffffff, map: texture};
var material = new THREE.MeshLambertMaterial(parameters);

var checker = new THREE.TextureLoader().load( 'checker.png' );
checker.minFilter = THREE.NearestFilter;
checker.magFilter = THREE.NearestFilter;


var loader2 = new THREE.CubeTextureLoader();
loader2.setPath( 'animegirl/' );

var textureCube = loader2.load( [
    'px.jpg', 'nx.jpg',
    'py.jpg', 'ny.jpg',
    'pz.jpg', 'nz.jpg'
] );
scene.background = textureCube;

// {
//   const loader2 = new THREE.CubeTextureLoader();
//   const texture = loader2.load([
//     'spacecubemap3/x+.png',
//     'spacecubemap3/x-.png',
//     'spacecubemap3/y+.png',
//     'spacecubemap3/y-.png',
//     'spacecubemap3/z+.png',
//     'spacecubemap3/z-.png',
//   ]);
//   scene.background = texture;
// }
var fullscreen_tri_geom = new THREE.BufferGeometry();
var scren_space_vert_positions = new Float32Array([
    -1.0 ,-1.0,
    3.0, -1.0,
    -1.0, 3.0
]);
fullscreen_tri_geom.addAttribute('position', new THREE.BufferAttribute(scren_space_vert_positions, 2));

var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
var target = new THREE.WebGLRenderTarget(resolution.x, resolution.y, { //buffer that holds ss tri
    format: THREE.RGBFormat,
    stencilBuffer: false,
    depthBuffer: true,
});
target.minFilter = THREE.LinearFilter;
target.magFilter = THREE.LinearFilter;

var bayer = new THREE.TextureLoader().load("bayer.png");
bayer.wrapS = THREE.RepeatWrapping;
bayer.wrapT = THREE.RepeatWrapping;
bayer.minFilter = THREE.NearestFilter;
bayer.magFilter = THREE.NearestFilter;

var ripple_material = new THREE.RawShaderMaterial({
    fragmentShader: document.getElementById('rippleFragmentShader').textContent,
    vertexShader: document.getElementById('rippleVertexShader').textContent,
    uniforms: {
      mr: { type: "vec4" , value: new THREE.Vector4(0.0,0.0,0.0,0.0)},
      bayer: { type: "t", value: bayer},
      time: {value: 0.0 },
      uScene: { value: bayer },
      uResolution: { value: resolution },
    },
});

var fractal_material = new THREE.RawShaderMaterial({
    fragmentShader: document.getElementById('fractalFragmentShader').textContent,
    vertexShader: document.getElementById('rippleVertexShader').textContent,
    uniforms: {
      shop: { type: "t" ,value: bayer},
      mr: { type: "vec4" , value: new THREE.Vector4(0.0,0.0,resolution.x,resolution.y)},
      bayer: { type: "t", value: bayer},
      time: {value: 0.0 },
      uScene: { value: bayer },
      uResolution: { value: resolution },
    },
});

var fullscreen_tri = new THREE.Mesh(fullscreen_tri_geom, ripple_material);
fullscreen_tri.frustumCulled = false;
scene.add(fullscreen_tri);

var fullscreen_tri_fractal = new THREE.Mesh(fullscreen_tri_geom, fractal_material);
fullscreen_tri_fractal.frustumCulled = false;
fractalscene.add(fullscreen_tri_fractal);




var uniforms = {
    texture1: { type: "t", value: null}
};
var ps1_shader_material = new THREE.ShaderMaterial({ 
    uniforms: uniforms,
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent,
    });

camera.position.z = 5;
var model_1;
var mixer;
var helper;
var skeleton_1;
loader.load( 'cube.gltf', function ( gltf ) {
    gltf.scene.traverse((o) => {
        if (o.isMesh){
            //o.material.map for gltf's texture
            uniforms.texture1.value = checker; //CHANGE THIS FOR EACH MODEL
            //o.material = material;
            o.material = ps1_shader_material;
            // o.material.roughness = 0.0;
            // o.material.envMap = textureCube;
            // o.material.map.anisotropy = 16;
        }
    });
    model_1 = gltf.scene;

    scene.add( model_1 ); //ORDER MATTERS HERE
    console.log(model_1);
}, undefined, function ( error ) {
	console.error( error );
} );

renderer.setSize(container.offsetWidth,container.offsetHeight);
container.appendChild( renderer.domElement );


var x = window.innerWidth / 2;
var y = window.innerHeight / 2;
function updateMousePos(event){
    x = event.clientX;
    y = event.clientY;
}
function animate() {
    requestAnimationFrame( animate );
    renderer.setRenderTarget(target);
    renderer.render( fractalscene, camera );
    fractal_material.uniforms.mr.value = new THREE.Vector4(x*0.25 / 2+ resolution.x*0.25 / 4, y*0.25 /2 + resolution.y*0.3,resolution.x,resolution.y);
    //    fractal_material.uniforms.mr.value = new THREE.Vector4(x / 2+ resolution.x*4 / 4, y /2 + resolution.y*4 / 4,resolution.x*4,resolution.y*4);
    ripple_material.uniforms.bayer.value = target.texture;
    //ps1_shader_material.uniforms.texture1.value = target.texture;
    renderer.setRenderTarget(null);
    ripple_material.uniforms.time.value += .005;
    renderer.getDrawingBufferSize(resolution);
    renderer.render( scene, camera );
    if(model_1){
        model_1.rotation.y = (x - resolution.x*4/2) / 10000;
        model_1.rotation.x = (y - resolution.y*4/2) / 10000;
    }
    // camera.rotation.z += .005;
}

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    resolution.x = window.innerWidth;
    resolution.y = window.innerHeight;
    target.width = window.innerWidth;
    target.height = window.innerHeight;
    fractal_material.uniforms.mr.value = new THREE.Vector4(x,y,resolution.x,resolution.y);
    fractal_material.uniforms.uResolution.value = resolution;
    ripple_material.uniforms.uResolution.value = resolution;
    //doesn't go past 21:9 ratio, if you want it to stretch render instead, just change apsect, not renderer.setSize
    console.log(window.innerWidth / window.innerHeight);
    if(window.innerWidth / window.innerHeight > 2.7){
        camera.aspect = window.innerHeight*2.253 / window.innerHeight;
        renderer.setSize( window.innerHeight*2.253, window.innerHeight );
    }
    else{
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize( window.innerWidth, window.innerHeight );
    }

    camera.updateProjectionMatrix();
}
animate();