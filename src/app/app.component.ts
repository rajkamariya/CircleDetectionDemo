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
  examType:string = '';
  circleMessage:string = 'Please place circular gauze into the middle of your camera view';
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
      this.context = this.canvas.nativeElement.getContext("2d")
    this.context.drawImage(this.videoEle.nativeElement, 0, 0, 640, 480);
      switch(this.detectionType){
        case 'Circle':
            setInterval(()=>{
              if(this.videoEle.nativeElement.videoHeight>0){
                this.animate();
              }
            },0)
            setInterval(()=>{
              this.circlePopup.nativeElement.innerHTML = this.circleMessage;
            },3000)
          break;
        case 'Dot':
          setInterval(()=>{  
            if(this.videoEle.nativeElement.videoHeight>0){
              this.dotDetection();
            }
          },0); 
          break;
        default:
          
          setInterval(()=>{
            if(this.videoEle.nativeElement.videoHeight>0){
            this.animate();
            }
          },0)
          setInterval(()=>{
            this.circlePopup.nativeElement.innerHTML = this.circleMessage;
          },3000)
          break;
      }
      
    })
  } 
  dotDetection(){
    console.log("DOT Detection");
     // Do stuff
    this.videoEle.nativeElement.height = this.videoEle.nativeElement.videoHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.videoWidth;
    let src = new cv.Mat(this.videoEle.nativeElement.videoHeight,this.videoEle.nativeElement.videoWidth,cv.CV_8UC4)
    let cap = new cv.VideoCapture(this.videoEle.nativeElement);
    cap.read(src);

    this.videoEle.nativeElement.height = this.videoEle.nativeElement.offsetHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.offsetWidth;
    let dst = new cv.Mat(this.videoEle.nativeElement.offsetHeight,this.videoEle.nativeElement.offsetWidth,cv.CV_8UC4)
    let dstcap = new cv.VideoCapture(this.videoEle.nativeElement);
    dstcap.read(dst);
    
     cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    //  let thresh = new cv.Mat();
    cv.threshold(src,src,50,50,cv.THRESH_BINARY|cv.THRESH_OTSU)
    // cv.Canny(src, src, 30, 100, 3, false);    
    //  console.log(thresh)
    let dot = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src,dot,hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
    // console.log(hierarchy);
    // let cnt = dot.get(20);
    console.log(dot.size())
    let redColor = new cv.Scalar(255, 0, 0, 255);
    // console.log(dot)
    cv.drawContours(dst,dot,-1,redColor,1,cv.LINE_4,hierarchy,1)
     
     cv.imshow('canvas', dst);
     src.delete();
     dst.delete();

  }
  animate() {
    // Do stuff
    let videoHeight = this.videoEle.nativeElement.videoHeight;
    let videoOffset = this.videoEle.nativeElement.offsetHeight;
    console.log(this.videoEle.nativeElement.videoHeight)
    this.videoEle.nativeElement.height = this.videoEle.nativeElement.videoHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.videoWidth;
    let src = new cv.Mat(this.videoEle.nativeElement.videoHeight,this.videoEle.nativeElement.videoWidth,cv.CV_8UC4)
    let cap = new cv.VideoCapture(this.videoEle.nativeElement);
    cap.read(src);

    this.videoEle.nativeElement.height = this.videoEle.nativeElement.offsetHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.offsetWidth;
    let dst = new cv.Mat(this.videoEle.nativeElement.offsetHeight,this.videoEle.nativeElement.offsetWidth,cv.CV_8UC4)
    let dstcap = new cv.VideoCapture(this.videoEle.nativeElement);
    dstcap.read(dst);
    
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    let ksize = new cv.Size(3, 3);
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
    
    // cv.Canny(src, src, 40, 150, 3, false);
    cv.HoughCircles(src,circles,cv.HOUGH_GRADIENT,1,100,85,85);

    if(circles.cols === 0){
      this.circlePopup.nativeElement.style.visibility = "visible";
      this.circleMessage = "Please place circular gauze into the middle of your camera view";
    }else if(circles.cols === 1){
      for(let i = 0; i < circles.cols; ++i) {
        let x = circles.data32F[i * 3]*videoOffset/videoHeight;
        let y = circles.data32F[i * 3 + 1]*videoOffset/videoHeight;
        let radius = circles.data32F[i * 3 + 2]*videoOffset/videoHeight;
        let center = new cv.Point(x, y);
        let smallCircle = new cv.Mat();
        let bigCircle = new cv.Mat();
        cv.HoughCircles(src,smallCircle,cv.HOUGH_GRADIENT,1,100,70,70,0,circles.data32F[i * 3 + 2]-5);
        cv.HoughCircles(src,bigCircle,cv.HOUGH_GRADIENT,1,100,70,70,circles.data32F[i * 3 + 2]+5);
        if(smallCircle.cols>0 || bigCircle.cols>0){
          this.examType = "Practice";
        }else{
          this.examType = "Exam";
        }
        let maxRadius = bigCircle.cols>0?(50*videoOffset/videoHeight):(60*videoOffset/videoHeight);
        if(radius<maxRadius){
          if(bigCircle.cols>0){
            for(let b = 0; b < bigCircle.cols; ++b) {
              let bx = bigCircle.data32F[b * 3]*videoOffset/videoHeight;;
              let by = bigCircle.data32F[b * 3 + 1]*videoOffset/videoHeight;;
              let bradius = bigCircle.data32F[b * 3 + 2]*videoOffset/videoHeight;;
              let bcenter = new cv.Point(bx, by);
              cv.circle(dst, bcenter, bradius, redColor,2);
            }
          }
          if(smallCircle.cols>0){
            for(let s = 0; s < smallCircle.cols; ++s) {
              let sx = smallCircle.data32F[s * 3]*videoOffset/videoHeight;;
              let sy = smallCircle.data32F[s * 3 + 1]*videoOffset/videoHeight;;
              let sradius = smallCircle.data32F[s * 3 + 2]*videoOffset/videoHeight;;
              let scenter = new cv.Point(sx, sy);
              cv.circle(dst, scenter, sradius, redColor,2);
            }
          }
          cv.circle(dst, center, radius, redColor,2);
          this.circlePopup.nativeElement.style.visibility = "visible";
          this.circleMessage = "Please bring the gauze closer to your camera view";
        }else{
          let leftEdge = this.videoEle.nativeElement.offsetWidth*20/100;
          let rightEdge = this.videoEle.nativeElement.offsetWidth*80/100;
          let circleLeftX = x-radius;
          let circleRightX = x+radius;
          let color;
          if(circleLeftX > leftEdge && circleRightX < rightEdge){
            this.circlePopup.nativeElement.style.visibility = "visible";
            this.circleMessage = "Now start performing your "+this.examType.toLowerCase()+" circular cutting task";
            color = greenColor;
          }else{
            this.circlePopup.nativeElement.style.visibility = "visible";
            this.circleMessage = "Please position your gauze in the middle of your camera view";
            color = redColor;
          }
          if(bigCircle.cols>0){
            for(let b = 0; b < bigCircle.cols; ++b) {
              let bx = bigCircle.data32F[b * 3]*videoOffset/videoHeight;;
              let by = bigCircle.data32F[b * 3 + 1]*videoOffset/videoHeight;;
              let bradius = bigCircle.data32F[b * 3 + 2]*videoOffset/videoHeight;;
              let bcenter = new cv.Point(bx, by);
              cv.circle(dst, bcenter, bradius, color,2);
            }
          }
          if(smallCircle.cols>0){
            for(let s = 0; s < smallCircle.cols; ++s) {
              let sx = smallCircle.data32F[s * 3]*videoOffset/videoHeight;
              let sy = smallCircle.data32F[s * 3 + 1]*videoOffset/videoHeight;
              let sradius = smallCircle.data32F[s * 3 + 2]*videoOffset/videoHeight;
              let scenter = new cv.Point(sx, sy);
              cv.circle(dst, scenter, sradius, color,2);
            }
          }
          cv.circle(dst, center, radius, color,2);
        }
      }
    }
  
    cv.imshow('canvas', dst);
    src.delete();
    dst.delete();

  }
}
