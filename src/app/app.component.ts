import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { NgxOpenCVService, OpenCVState } from 'ngx-opencv';
// import cv from 'opencv-ts';
declare var cv: any; 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit{
    
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>; 
  @ViewChild('canvasTest', { static: true })
  canvasTest: ElementRef<HTMLCanvasElement>; 
  @ViewChild('video') videoEle: ElementRef<any>;
  @ViewChild('circleTooltip') circleText:ElementRef<any>;
  @ViewChild('circlePopup') circlePopup:ElementRef<any>;
  isPopup = false;
  context;
  cvState: string;
  detectionType = "Circle";

  constructor(private ngZone:NgZone,private ngxOpenCv: NgxOpenCVService){
    
  }

  ngOnInit(){
    console.log(this.videoEle)
    console.log(this.cvState)
    this.ngxOpenCv.cvState.subscribe(
	    (cvState: OpenCVState) => {
      if(cvState.ready){
        this.initRecording();
      }
    });
  }

  initRecording(){
    navigator.mediaDevices.getUserMedia({video:true}).then(stream=>{
      console.log(stream);
      this.videoEle.nativeElement.srcObject = stream;
      switch(this.detectionType){
        case 'Circle':
          this.animate();
          break;
        case 'Dot':
          this.dotDetection();
          break;
        default:
          this.animate();
          break;
      }
      
    })
  } 
  dotDetection(){
    console.log("DOT Detection");
     // Do stuff
     this.context = this.canvas.nativeElement.getContext("2d")
     this.context.drawImage(this.videoEle.nativeElement, 0, 0, 640, 480);
     let src = cv.imread('canvas');
     
     this.canvasTest.nativeElement.getContext("2d").clearRect(0, 0, 640, 480);
     let dst = cv.imread('canvasTest');
     cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
     let thresh = new cv.Mat();
    //  cv.threshold(src,src,100,255,cv.THRESH_BINARY|cv.THRESH_OTSU)
    cv.Canny(src, src, 30, 100, 3, false);    
    //  console.log(thresh)
    // let dot = new cv.MatVector();
    // let hierarchy = new cv.Mat();
    // cv.findContours(src,dot,hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
    //  cv.findContours(thresh,dot, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)

    let redColor = new cv.Scalar(255, 0, 0, 255);
    //  console.log(hierarchy)
    //  cv.drawContours(dst,dot,-1,redColor,1)
     let greenColor = new cv.Scalar(0,255,0,255);
     
     let circles = new cv.Mat();
     cv.HoughCircles(src, circles, cv.HOUGH_GRADIENT,
      1, 100,60,60);
      console.log(circles)
      for(let i = 0; i < circles.cols; ++i) {
        let x = circles.data32F[i * 3];
        let y = circles.data32F[i * 3 + 1];
        let radius = circles.data32F[i * 3 + 2];
        let center = new cv.Point(x, y);
        cv.circle(dst, center, radius, redColor,2);
      }
     cv.imshow('canvasTest', dst);
     src.delete();
     dst.delete();
 
     setTimeout(()=>{
       requestAnimationFrame(this.dotDetection.bind(this));
     },10)
  }
  animate() {
    // Do stuff
    this.context = this.canvas.nativeElement.getContext("2d")
    this.context.drawImage(this.videoEle.nativeElement, 0, 0, 640, 480);
    let src = cv.imread('canvas');
    
    this.canvasTest.nativeElement.getContext("2d").clearRect(0, 0, 640, 480);
    let dst = cv.imread('canvasTest');
    
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    // let ksize = new cv.Size(3, 3);
    // let anchor = new cv.Point(-1, -1);
        
    // cv.blur(src,src,ksize,anchor,) 
    // cv.GaussianBlur(src,src,ksize,0)
    cv.medianBlur(src,src,3) 
    
    let circles = new cv.Mat();
    // let circles

    let redColor = new cv.Scalar(255, 0, 0, 255);
    let greenColor = new cv.Scalar(0,255,0,255);
    // You can try more different parameters
    // let minDist = 100
    // // let param1 = 80
    // // let param2 = 70
    // // let minRadius = 0
    // // let maxRadius = 0
    
    // cv.Canny(src, src, 40, 150, 3, false);
    let examType:string='';
    cv.HoughCircles(src, circles, cv.HOUGH_GRADIENT,
                        1, 100,90,90);
    
    if(circles.cols === 0){
      this.circlePopup.nativeElement.style.visibility="visible";
      this.circlePopup.nativeElement.innerHTML = 'Please place circular gauze into the middle of your camera view';
    }else{
      for(let i = 0; i < circles.cols; ++i) {
        let x = circles.data32F[i * 3];
        let y = circles.data32F[i * 3 + 1];
        let radius = circles.data32F[i * 3 + 2];
        let center = new cv.Point(x, y);

        let smallCircle = new cv.Mat();
        let bigCircle = new cv.Mat();

        cv.HoughCircles(src, smallCircle, cv.HOUGH_GRADIENT,
          1, 100,85,85,0,radius-5);
        cv.HoughCircles(src, bigCircle, cv.HOUGH_GRADIENT,
            1, 100,85,85,radius+5);

        if(smallCircle.cols>0 || bigCircle.cols>0){
          examType = "Practice";
        }else{
          examType = "Exam";
        }
        
        let maxRadius = bigCircle.cols>0?75:100;
        
        if(radius<maxRadius){
          for(let b = 0; b < bigCircle.colb; ++b) {
            let bx = bigCircle.data32F[b * 3];
            let by = bigCircle.data32F[b * 3 + 1];
            let bradius = bigCircle.data32F[b * 3 + 2];
            let bcenter = new cv.Point(bx, by);
            cv.circle(dst, bcenter, bradius, redColor,2);
          }
          for(let s = 0; s < smallCircle.cols; ++s) {
            let sx = smallCircle.data32F[s * 3];
            let sy = smallCircle.data32F[s * 3 + 1];
            let sradius = smallCircle.data32F[s * 3 + 2];
            let scenter = new cv.Point(sx, sy);
            cv.circle(dst, scenter, sradius, redColor,2);
          }
          cv.circle(dst, center, radius, redColor,2);
          this.circlePopup.nativeElement.innerHTML = 'Please bring the gauze closer to your camera view'
        }else{
          for(let b = 0; b < bigCircle.colb; ++b) {
            let bx = bigCircle.data32F[b * 3];
            let by = bigCircle.data32F[b * 3 + 1];
            let bradius = bigCircle.data32F[b * 3 + 2];
            let bcenter = new cv.Point(bx, by);
            cv.circle(dst, bcenter, bradius, greenColor,2);
          }
          for(let s = 0; s < smallCircle.cols; ++s) {
            let sx = smallCircle.data32F[s * 3];
            let sy = smallCircle.data32F[s * 3 + 1];
            let sradius = smallCircle.data32F[s * 3 + 2];
            let scenter = new cv.Point(sx, sy);
            cv.circle(dst, scenter, sradius, greenColor,2);
          }

          cv.circle(dst, center, radius, greenColor,2);
          let leftEdge = this.canvas.nativeElement.width*20/100;
          let rightEdge = this.canvas.nativeElement.width*80/100;
          let circleLeftX = x-radius;
          let circleRightX = x+radius;
          if(circleLeftX>leftEdge && circleRightX<rightEdge){
            this.circlePopup.nativeElement.innerHTML = 'Now start performing your '+examType.toLowerCase()+' circular cutting task'
          }else{
            this.circlePopup.nativeElement.innerHTML = 'Please position your gauze in the middle of your camera view'
          }
        }
      }
    }
  
    cv.imshow('canvasTest', dst);
    src.delete();
    dst.delete();

    // setTimeout(()=>{
      requestAnimationFrame(this.animate.bind(this));
    // },10)

  }
}
