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
  detectionType = "Circle";//Dot,Circle
  examType:string = '';
  // circleMessage:string = 'Please place circular gauze into the middle of your camera view';
  defualtMessageTimeout;
  showDefaultMessage:boolean = true;

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
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(stream=>{
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
            
          break;
        case 'Dot':
          setInterval(()=>{  
          // setTimeout(()=>{ 
          if(this.videoEle.nativeElement.videoHeight>0){
              this.dotDetection();
            // }},2000)
          }
          },0); 
          break;
        default:
          
          setInterval(()=>{
            if(this.videoEle.nativeElement.videoHeight>0){
            this.animate();
            }
          },0)
          
          break;
      }
      
    })
  } 
  dotDetection(){
    console.log("DOT Detection");
     // Do stuff
    let videoHeight = this.videoEle.nativeElement.videoHeight;
    let videoWidth = this.videoEle.nativeElement.videoWidth;
    let videoOffset = this.videoEle.nativeElement.offsetHeight;
    
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
    // let msize = new cv.Size(3, 3);
    // let anchor = new cv.Point(-1, -1);
        
    // cv.blur(src,src,ksize,anchor,) 
    // cv.GaussianBlur(src,src,msize,0)
    // cv.medianBlur(src,src,3) 

    cv.threshold(src,src,100,255,cv.THRESH_BINARY|cv.THRESH_OTSU)
    // cv.Canny(src, src, 30, 100, 3, false);    
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    let redColor = new cv.Scalar(255, 0, 0, 255);
    let greenColor = new cv.Scalar(0, 255, 0, 255);

    cv.findContours(src,contours,hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
    
    // cv.drawContours(dst,contours,-1, redColor, 1, 8, hierarchy, 1);
    let dots =[];
    for (let i = 0; i < contours.size(); ++i) {
      let tmp = new cv.Mat();
      let cnt = contours.get(i);
      // cv.approxPolyDP(cnt,tmp,contours.size()*0.05,true)
      cv.convexHull(cnt, tmp, false, true);
      if(tmp.total()>8){
        let circle = cv.minEnclosingCircle(cnt);
        let circleArea = (3.14*circle.radius*circle.radius)-((3.14*circle.radius*circle.radius)*21/100);
        // let circleArea = (3.14*circle.radius*circle.radius)-50;        
        if(circleArea>0){
          
            // console.log(3.14*circle.radius*circle.radius)

          if(cv.contourArea(tmp)>circleArea)
          {
            console.log(cv.contourArea(tmp))
            console.log(circleArea)  
            // console.log(circle.radius);
            console.log(3.14*circle.radius*circle.radius)

            if(circle.radius<15){
              circle.center.x =circle.center.x * videoOffset/videoHeight;
              circle.center.y =circle.center.y * videoOffset/videoHeight 
              circle.radius =circle.radius * videoOffset/videoHeight 
              dots.push({center:circle.center,radius:circle.radius});
              cv.circle(dst, circle.center, circle.radius, redColor);
            }
          }
        }
      }
      cnt.delete(); 
      tmp.delete();
    }
    console.log(dots)
    if(dots.length >0 ){
      for(let i=0;i<dots.length;i++){

      }
    }
    cv.imshow('canvas', dst);
    src.delete();
    dst.delete();
    contours.delete();
    hierarchy.delete();
  }
  animate() {
    // Do stuff
    // console.log(this.videoEle.nativeElement.offsetWidth);
    let videoHeight = this.videoEle.nativeElement.videoHeight;
    let videoWidth = this.videoEle.nativeElement.videoWidth;
    let videoOffset = this.videoEle.nativeElement.offsetHeight;
    // console.log(this.videoEle.nativeElement.videoHeight)
    this.videoEle.nativeElement.height = this.videoEle.nativeElement.videoHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.videoWidth;
    let src = new cv.Mat(this.videoEle.nativeElement.videoHeight,this.videoEle.nativeElement.videoWidth,cv.CV_8UC4)
    let srcdata = new cv.Mat(); 
    let cap = new cv.VideoCapture(this.videoEle.nativeElement);
    
    cap.read(src);
    //From This
    let ssize = new cv.Size(this.videoEle.nativeElement.videoWidth,this.videoEle.nativeElement.videoHeight);
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.videoEle.nativeElement.width, 0, 0, this.videoEle.nativeElement.height, this.videoEle.nativeElement.width, this.videoEle.nativeElement.height]);
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.videoEle.nativeElement.width, 0, 100, this.videoEle.nativeElement.height, this.videoEle.nativeElement.width-100, this.videoEle.nativeElement.height]);

    let M = cv.getPerspectiveTransform(srcTri, dstTri);

    cv.warpPerspective(src, srcdata, M, ssize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    //This
    this.videoEle.nativeElement.height = this.videoEle.nativeElement.offsetHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.offsetWidth;
    let dst = new cv.Mat(this.videoEle.nativeElement.offsetHeight,this.videoEle.nativeElement.offsetWidth,cv.CV_8UC4)
    let dstcap = new cv.VideoCapture(this.videoEle.nativeElement);
    dstcap.read(dst);
    //From this to
    let dsize = new cv.Size( this.videoEle.nativeElement.offsetWidth,this.videoEle.nativeElement.offsetHeight);

    srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.videoEle.nativeElement.width, 0, 0, this.videoEle.nativeElement.height, this.videoEle.nativeElement.width, this.videoEle.nativeElement.height]);

    dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.videoEle.nativeElement.width, 0, 100, this.videoEle.nativeElement.height, this.videoEle.nativeElement.width-100, this.videoEle.nativeElement.height]);

    M = cv.getPerspectiveTransform(srcTri, dstTri);

    cv.warpPerspective(dst, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    //This
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(srcdata, srcdata, cv.COLOR_RGBA2GRAY);
    let ksize = new cv.Size(3, 3);
    // let anchor = new cv.Point(-1, -1);
        
    // cv.blur(src,src,ksize,anchor,) 
    cv.GaussianBlur(src,src,ksize,0)
    cv.medianBlur(src,src,3) 
    cv.GaussianBlur(srcdata,srcdata,ksize,0)
    cv.medianBlur(srcdata,srcdata,3) 
    
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
    let regular = false;
    // cv.Canny(src, src, 40, 150, 3, false);
    cv.HoughCircles(srcdata,circles,cv.HOUGH_GRADIENT,1,100,85,85);
    // console.log(circles)
    if(circles.cols === 0){
      M = cv.getPerspectiveTransform(dstTri,srcTri);
      regular = true;
      // cv.warpPerspective(src, src, M, ssize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
      cv.warpPerspective(dst, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
      cv.HoughCircles(src,circles,cv.HOUGH_GRADIENT,1,100,85,85);
     // console.log(circles)
    }
    if(circles.cols === 0){
      this.circlePopup.nativeElement.style.visibility = "visible";
      if(this.showDefaultMessage){  
        this.circlePopup.nativeElement.innerHTML = "Please place circular gauze into the middle of your camera view";
      }
    }else if(circles.cols === 1){
      this.showDefaultMessage = false;
      if(this.defualtMessageTimeout){
        clearTimeout(this.defualtMessageTimeout);
      }
      this.defualtMessageTimeout=setTimeout(()=>{
        this.showDefaultMessage = true;
      },2000);

      for(let i = 0; i < circles.cols; ++i) {
        let x = circles.data32F[i * 3]*videoOffset/videoHeight;
        let y;
        let radius = circles.data32F[i * 3 + 2]*videoOffset/videoHeight;
        //From This
        if(regular){
          y = circles.data32F[i * 3 + 1]*videoOffset/videoHeight;
        }else{
          if(videoHeight>videoWidth){
            y = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)+15;
          }else{
            y = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)-15;
          }
        }
        //To This
        let center = new cv.Point(x, y);
        let smallCircle = new cv.Mat();
        let bigCircle = new cv.Mat();
        //FRom this
        if(regular){
          cv.HoughCircles(src,smallCircle,cv.HOUGH_GRADIENT,1,100,70,70,0,circles.data32F[i * 3 + 2]-15);
          cv.HoughCircles(src,bigCircle,cv.HOUGH_GRADIENT,1,100,70,70,circles.data32F[i * 3 + 2]+15,300);
        }else{
          cv.HoughCircles(srcdata,smallCircle,cv.HOUGH_GRADIENT,1,100,70,70,0,radius-30);
          cv.HoughCircles(srcdata,bigCircle,cv.HOUGH_GRADIENT,1,100,70,70,radius+30,300);
        }
        //To this
        if(smallCircle.cols>0 || bigCircle.cols>0){
          this.examType = "Practice";
        }else{
          this.examType = "Exam";
        }
        let maxRadius = bigCircle.cols>0?(50*videoOffset/videoHeight):(60*videoOffset/videoHeight);
        if(radius<maxRadius){
          if(bigCircle.cols===1){
            for(let b = 0; b < bigCircle.cols; ++b) {
              let bx = bigCircle.data32F[b * 3]*videoOffset/videoHeight;
              let by;
              let bradius = bigCircle.data32F[b * 3 + 2]*videoOffset/videoHeight;
              //From This
              if(regular){
                by = circles.data32F[i * 3 + 1]*videoOffset/videoHeight;
              }else{
                if(videoHeight>videoWidth){
                  by = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)+15;
                }else{
                  by = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)-15;
                }
              }
              //To This
              let bcenter = new cv.Point(bx, by);
              cv.circle(dst, bcenter, bradius, redColor,2);
            }
          }
          if(smallCircle.cols===1){
            for(let s = 0; s < smallCircle.cols; ++s) {
              let sx = smallCircle.data32F[s * 3]*videoOffset/videoHeight;
              let sy;
              let sradius = smallCircle.data32F[s * 3 + 2]*videoOffset/videoHeight;
              //From This
              if(regular){
                sy = circles.data32F[i * 3 + 1]*videoOffset/videoHeight;
              }else{
                if(videoHeight>videoWidth){
                  sy = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)+15;
                }else{
                  sy = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)-15;
                }
              }
              //To This
              let scenter = new cv.Point(sx, sy);
              cv.circle(dst, scenter, sradius, redColor,2);
            }
          }
          cv.circle(dst, center, radius, redColor,2);
          this.circlePopup.nativeElement.style.visibility = "visible";
          this.circlePopup.nativeElement.innerHTML = "Please bring the gauze closer to your camera view";
        }else{
          let leftEdge = this.videoEle.nativeElement.offsetWidth*20/100;
          let rightEdge = this.videoEle.nativeElement.offsetWidth*80/100;
          let circleLeftX = x-radius;
          let circleRightX = x+radius;
          let color;
          if(circleLeftX > leftEdge && circleRightX < rightEdge){
            this.circlePopup.nativeElement.style.visibility = "visible";
            this.circlePopup.nativeElement.innerHTML = "Now start performing your "+this.examType.toLowerCase()+" circular cutting task";
            color = greenColor;
          }else{
            this.circlePopup.nativeElement.style.visibility = "visible";
            this.circlePopup.nativeElement.innerHTML = "Please position your gauze in the middle of your camera view";
            color = redColor;
          }
          if(bigCircle.cols===1){
            for(let b = 0; b < bigCircle.cols; ++b) {
              let bx = bigCircle.data32F[b * 3]*videoOffset/videoHeight;
              let by;
              let bradius = bigCircle.data32F[b * 3 + 2]*videoOffset/videoHeight;
              //From This
              if(regular){
                by = circles.data32F[i * 3 + 1]*videoOffset/videoHeight;
              }else{
                if(videoHeight>videoWidth){
                  by = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)+15;
                }else{
                  by = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)-15;
                }
              }
              //To This
              let bcenter = new cv.Point(bx, by);
              cv.circle(dst, bcenter, bradius, color,2);
            }
          }
          if(smallCircle.cols===1){
            for(let s = 0; s < smallCircle.cols; ++s) {
              let sx = smallCircle.data32F[s * 3]*videoOffset/videoHeight;
              let sy;
              let sradius = smallCircle.data32F[s * 3 + 2]*videoOffset/videoHeight;
              //From This
              if(regular){
                sy = circles.data32F[i * 3 + 1]*videoOffset/videoHeight;
              }else{
                if(videoHeight>videoWidth){
                  sy = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)+15;
                }else{
                  sy = (circles.data32F[i * 3 + 1]*videoOffset/videoHeight)-15;
                }
              }
              //To This
              let scenter = new cv.Point(sx, sy);
              cv.circle(dst, scenter, sradius, color,2);
            }
          }
          cv.circle(dst, center, radius, color,2);
        }
        smallCircle.delete();
        bigCircle.delete();
      }
    }
    //From this
    if(!regular){
      let E = cv.getPerspectiveTransform(dstTri, srcTri);
      cv.warpPerspective(dst, dst, E, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
      E.delete();
    }
    //This
    cv.imshow('canvas', dst);
    src.delete();
    srcdata.delete();
    dst.delete();
    circles.delete();
    M.delete();
    srcTri.delete();
    dstTri.delete();
  }
}
