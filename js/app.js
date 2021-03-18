import * as THREE from 'three';
import gsap from 'gsap';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import fragment from './shader/fragment.glsl'
import vertex from './shader/vertex.glsl'

import dispImg from "../img/disp1.jpg"
import dispImg2 from "../img/muellpng.png"
import img1 from "../img/nyc.png"
import img2 from "../img/mantel.png"
import img3 from "../img/nikestuff.jpg"

import whitebg from "../img/white.jpg"

import matcap from '../img/matcap.png'

import { WebGLShadowMap } from 'three';

import '../styling/styles.scss';

const matcapTex = new THREE.TextureLoader(matcap)

class Sketch {
  constructor(opts) {
    this.scene = new THREE.Scene();
    this.vertex = vertex
    this.fragment = fragment
    this.uniforms = opts.uniforms;
    this.renderer = new THREE.WebGLRenderer();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.duration = opts.duration || 1;
    this.debug = opts.debug || false
    this.easing = opts.easing || 'easeInOut'
    this.hoverState = 1

    this.rotation = 0.5

    this.clicker = document.getElementById("content");

    this.projects = document.querySelectorAll('.project');

    this.container = document.getElementById("slider");
    this.images = [img1, img2, img3]
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 2);
    this.time = 0;
    this.current = 0;
    this.textures = [];


    this.paused = true;
    this.initiate(()=>{
      console.log('now')
      console.log(this.textures);
      this.setupResize();
      this.settings();
      this.addObjects();
      this.resize();
      this.clickEvent();
      this.setupViewport()
      this.setupViewport()
      this.hideRing()
      this.play();
    })
    


  }

  initiate(cb){
    const promises = [];
    let that = this;
    console.log(this.images)
    this.images.forEach((img,i)=>{
      let promise = new Promise(resolve => {
        that.textures[i] = new THREE.TextureLoader().load( img, resolve );
      });
      promises.push(promise);
    })

    this.whiteTex = new THREE.TextureLoader().load( whitebg )

    Promise.all(promises).then(() => {
      cb();
    });
  }

  clickEvent(){
    // this.clicker.addEventListener('click',()=>{
    //   this.next();
    // })

    //Show image for each on click and hover

    this.projects.forEach((project, i) => {

      project.addEventListener('click', ()=> {

        var elems = document.querySelectorAll(".active");
        elems.forEach(el => {
          el.classList.remove('active')
        })
        if (!project.classList.contains('active')) {
          
          project.classList.toggle('active')
          this.selectImg(i)
          //console.log(i)
        }
      })

      project.addEventListener('touch', ()=> {

        var elems = document.querySelectorAll(".active");
        elems.forEach(el => {
          el.classList.remove('active')
        })
        if (!project.classList.contains('active')) {
          
          project.classList.toggle('active')
          this.selectImg(i)
          //console.log(i)
        }
      })

      project.addEventListener('mouseenter', ()=> {
        
        var elems = document.querySelectorAll(".active");
        elems.forEach(el => {
          el.classList.remove('active')
        })
        if (!project.classList.contains('active')) {
          
          project.classList.toggle('active')
          this.selectImg(i)
          //console.log(i)

          //this.scene.remove( this.ring )
        }
      })


      project.addEventListener('mouseleave', ()=> {
        
        if (project.classList.contains('active')) {
          
          project.classList.remove('active')
          //this.selectImg(i)
          //console.log(i)
          //this.scene.add( this.ring )
          
        }
      })

      document.querySelector('.title').addEventListener('mouseleave', ()=> {
          
        if(this.isRunning) return;
        this.isRunning = true;
        let nextTexture = this.whiteTex
        this.material.uniforms.texture2.value = nextTexture;
        let tl = new gsap.timeline()
        tl.to(this.material.uniforms.progress,this.duration,{
        value:1,
        //ease: gsap.Power2[this.easing],
        onComplete:()=>{
          //console.log('FINISH');
          this.material.uniforms.texture1.value = nextTexture;
          this.material.uniforms.progress.value = 0;
          this.isRunning = false;
        }})
          
      })
    })
  }
  settings() {
    let that = this;
    if(this.debug) this.gui = new dat.GUI();
    this.settings = {progress:0.5};
    // if(this.debug) this.gui.add(this.settings, "progress", 0, 1, 0.01);

    Object.keys(this.uniforms).forEach((item)=> {
      this.settings[item] = this.uniforms[item].value;
      if(this.debug) this.gui.add(this.settings, item, this.uniforms[item].min, this.uniforms[item].max, 0.01);
    })

    //this.gui.add(this.rotation,).min(0).max(2).step(0.001)
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    

    // image cover
    this.imageAspect = this.textures[0].image.height/this.textures[0].image.width;
    let a1; let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect ;
      a2 = 1;
    } else{
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    const dist  = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2*(180/Math.PI)*Math.atan(height/(2*dist));

    this.plane.scale.x = this.camera.aspect;
    this.plane.scale.y = 1;

    this.camera.updateProjectionMatrix();


  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      //side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        progress: { type: "f", value: 0 },
        border: { type: "f", value: 0 },
        intensity: { type: "f", value: 0 },
        scaleX: { type: "f", value: 40 },
        scaleY: { type: "f", value: 40 },
        transition: { type: "f", value: 40 },
        swipe: { type: "f", value: 0 },
        width: { type: "f", value: 0 },
        radius: { type: "f", value: 0 },
        texture1: { type: "f", value: this.whiteTex },
        texture2: { type: "f", value: this.whiteTex },
        displacement: { type: "f", value: new THREE.TextureLoader().load(dispImg2) },
        resolution: { type: "v4", value: new THREE.Vector4() },
      },
      // wireframe: true,
      vertexShader: this.vertex,
      fragmentShader: this.fragment
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 2, 2);

    this.material2 = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      wireframe: true,
      transparent: true,
      opacity: this.hoverState
    })
    //this.material2.matcap = matcapTex

    this.geometry2 = new THREE.TorusGeometry(0.15, 0.005, 4, 64)

    this.ring = new THREE.Mesh(this.geometry2, this.material2);
    this.ring.position.z = 1

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane, this.ring);
  }

  stop() {
    this.paused = true;
  }

  play() {
    this.paused = false;
    this.render();
  }

  next(){
    if(this.isRunning) return;
    this.isRunning = true;
    let len = this.textures.length;
    let nextTexture =this.textures[(this.current +1)%len];
    this.material.uniforms.texture2.value = nextTexture;
    let tl = new gsap.timeline()
    tl.to(this.material.uniforms.progress,this.duration,{
      value:1,
      //ease: gsap.Power2[this.easing],
      onComplete:()=>{
        console.log('FINISH');
        this.current = (this.current +1)%len;
        this.material.uniforms.texture1.value = nextTexture;
        this.material.uniforms.progress.value = 0;
        this.isRunning = false;
    }})
  }

  selectImg(idx){
    if(this.isRunning) return;
    this.isRunning = true;
    //let len = this.textures.length;
    let nextTexture = this.textures[idx];
    
    this.material.uniforms.texture2.value = nextTexture;
    
    let tl = new gsap.timeline()
    tl.to(this.material.uniforms.progress,this.duration * 0.5,{
      value:1,
      ease: 'easeInOut',
      onComplete:()=>{
        console.log('FINISH');
        this.current = idx + 1;
        this.material.uniforms.texture1.value = nextTexture;
        this.material.uniforms.progress.value = 0;
        this.isRunning = false;
    }})
  }

  setupViewport() {
    window.addEventListener("scroll", this.fakeViewport.bind(this));
  }

  fakeViewport() {
    const contactTag = document.querySelector('.contact')
    const topOfContact = contactTag.offsetTop
    // console.log(topOfContact)
    // console.log(window.scrollY)

    if (topOfContact <= (window.scrollY + 100)) {
      // console.log('now its higher')

      var elems = document.querySelectorAll(".active");
        elems.forEach(el => {
          el.classList.remove('active')
      })

      // console.log(this)
      //if(this.isRunning) return;
      this.isRunning = true;
      let nextTexture = this.whiteTex
      this.material.uniforms.texture2.value = nextTexture;
      let tl = new gsap.timeline()
      tl.to(this.material.uniforms.progress,this.duration,{
        value:1,
        //ease: gsap.Power2[this.easing],
        onComplete:()=>{
          //console.log('FINISH');
          this.material.uniforms.texture1.value = nextTexture;
          this.material.uniforms.progress.value = 0;
          this.isRunning = false;
      }})
    }
  }

  setupViewport2() {
    window.addEventListener("scroll", this.viewport.bind(this));
  }

  viewport() {

     this.scrollPos = window.pageYOffset 
      //console.log(window.innerHeight/2)
        
      var elems = document.querySelectorAll(".active");
        
      elems.forEach(el => {
          el.classList.remove('active')
      })

      this.projects.forEach((project, i) => {

        const topOfProject = project.offsetTop

        let bounds = project.getBoundingClientRect()
          
        if (bounds.top <= window.innerHeight * 0.5) {

          if (!project.classList.contains('active')) {


            project.classList.toggle('active')
            this.selectImg(i)
          }
        } 
      })
  }

  hideRing() {
    document.addEventListener('scroll', () => {

      this.scrollPos = window.pageYOffset 
      //console.log(window.innerHeight/2)

      if (this.scrollPos > window.innerHeight * 0.5) {

        this.ring.material.opacity = 0
        gsap.to(this.ring.material.opacity, {
          duration: 1,
          value: 0
        })
      }
      else {
        this.ring.material.opacity = 1
      }
    })
  }

  render() {
    if (this.paused) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    // this.material.uniforms.progress.value = this.settings.progress;

    Object.keys(this.uniforms).forEach((item)=> {
      this.material.uniforms[item].value = this.settings[item];
    });

    // this.camera.position.z = 3;
     this.ring.rotation.y = this.rotation*Math.cos(this.time*0.5)
     this.ring.rotation.x = this.rotation*Math.cos(0.4*this.time*0.5)

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}



new Sketch({
	debug: false,
	uniforms: {
    intensity: {value: 0.8, type:'f', min:0., max:20},
    width: {value: 0.5, type:'f', min:0, max:10},
	}
});



