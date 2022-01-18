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
  @ViewChild('video') videoEle: ElementRef<any>;
  @ViewChild('circleTooltip') circleText:ElementRef<any>;
  context;
  cvState: string;

  constructor(private ngZone:NgZone,private ngxOpenCv: NgxOpenCVService){
    // this.ngZone.runOutsideAngular(() => this.animate());
    // subscribe to status of OpenCV module  
    // this.ngxOpenCv.cvState.subscribe(
	  //   (cvState: OpenCVState) => {  
    //     console.log(cvState)
        
	  //     // do something with the state string
	  //     // cvState.state;  
	  //     if (cvState.error) {
	  //       // handle errors
    //       console.log("OpenCV is Error")
	  //     } else if (cvState.loading) {
	  //       // e.g. show loading indicator
    //       console.log("OpenCV is Loading")  
	  //     } else if (cvState.ready) {  
	  //       // do image processing stuff
    //       console.log("OpenCV is Ready")
    //       console.log(cv)
	  //     }  
	  // });
    // console.log(this.cvState)
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
      
      this.animate();
      
    })
  } 
  animate() {
    // Do stuff
    this.context = this.canvas.nativeElement.getContext("2d")
    this.context.drawImage(this.videoEle.nativeElement, 0, 0, 640, 480);
    let src = cv.imread('canvas');
    let dst = cv.imread('canvas');
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    let ksize = new cv.Size(5, 5);
    // let anchor = new cv.Point(-1, -1);
        
    // cv.blur(src,src,ksize,anchor,) 
    cv.GaussianBlur(src,src,ksize,0)
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
    
    cv.HoughCircles(src, circles, cv.HOUGH_GRADIENT,
                        1, 100,90,80,1,200);
    // draw circles
    this.circleText.nativeElement.style.display = 'none';    
    for(let i = 0; i < circles.cols; ++i) {
      let x = circles.data32F[i * 3];
      let y = circles.data32F[i * 3 + 1];
      let radius = circles.data32F[i * 3 + 2];
      let center = new cv.Point(x, y);
      if(radius<50){
        cv.circle(dst, center, radius, redColor,2);
      }else{
        cv.circle(dst, center, radius, greenColor,2);
        this.circleText.nativeElement.style.display = 'block';
        this.circleText.nativeElement.style.top = (y-(radius*1.6)) + 'px';
        this.circleText.nativeElement.style.left = (x +20) + 'px';
      }
      
    }
        
        
    cv.imshow('canvas', dst);
    src.delete();
    dst.delete();
    requestAnimationFrame(this.animate.bind(this));
  }
}
