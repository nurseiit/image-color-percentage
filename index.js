let inpEl = document.getElementById("myInput");
inpEl.addEventListener("change", fileHandler, false);

function fileHandler(e) {
  let file = e.target.files[0];
  let reader = new FileReader();
  reader.addEventListener("load", main, false);
  reader.readAsArrayBuffer(file);
}
function main(e) {
  let c = document.getElementById("myCanvas");
  let ctx = c.getContext("2d");

  let buffer = e.target.result;
  let bitmap = getBMP(buffer)
  let temp = convertToImageData(bitmap);
  let width = temp.width
  let height = temp.height;
  c.width = width;
  c.height = height;

  let img = new Image();
  img.src = "data:image/png;base64," + btoa([].reduce.call(new Uint8Array(buffer),function(p,c){return p+String.fromCharCode(c)},''));
  img.onload = function () {
   ctx.drawImage(img, 0, 0);
    var imgData=ctx.getImageData(0,0,c.width,c.height);
    // count colors
    let result = {};
    for (let i = 0; i < imgData.data.length; i+=4) {   
      let r = imgData.data[i];
      let g = imgData.data[i+1];
      let b = imgData.data[i+2];
      let val = rgbToInt (r, g, b);
      result[val] = !result[val] ? 1 : result[val] + 1;
    }    
    let sorted = Object.keys(result).sort(function (a, b) {
      return result[b] - result[a];
    });
    let total = width * height;
      let end = []
    for (let key in sorted) {
      let percent = result[sorted[key]] / total * 100.0;
      let rgb = sorted[key];
      let r = (rgb >> 16) & 0xFF;
      let g = (rgb >> 8) & 0xFF;
      let b = rgb & 0xFF;
      let now = {
        percent,
        r,
        g,
        b
      };
      end.push(now);
    }
    drawToUI(end);
  }
}

function rgbToInt (r, g, b) {
  return (0xff000000 | (r << 16) | (g << 8) | b);
}

function getBMP(buffer) {
  let datav = new DataView(buffer);
  let bitmap = {};

  bitmap.fileheader = {};
  bitmap.fileheader.bfOffBits = datav.getUint32(10, true);

  bitmap.infoheader = {};
  bitmap.infoheader.biWidth = datav.getUint32(18, true);
  bitmap.infoheader.biHeight = datav.getUint32(22, true);
  bitmap.infoheader.biBitCount = datav.getUint16(28, true);

  let start = bitmap.fileheader.bfOffBits;
  bitmap.stride = Math.floor((bitmap.infoheader.biBitCount * bitmap.infoheader.biWidth + 31) / 32) * 4;
  bitmap.pixels = new Uint8Array(buffer, start);
  return bitmap;
}

function convertToImageData(bitmap) {
  canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d"); 
  let Width = bitmap.infoheader.biWidth;
  let Height = bitmap.infoheader.biHeight;
  let imageData = ctx.createImageData(Width, Height);
  let data = imageData.data;
  let bmpdata = bitmap.pixels;
  let stride = bitmap.stride;

  for (let y = 0; y < Height; ++y) {
    for (let x = 0; x < Width; ++x) {
        let index1 = (x + Width * (Height - y)) * 4;
        let index2 = x * 3 + stride * y;
        data[index1] = bmpdata[index2 + 2];
        data[index1 + 1] = bmpdata[index2 + 1];
        data[index1 + 2] = bmpdata[index2];
        data[index1 + 3] = 255;
    }
  }
  return imageData;
}      

function drawToUI (foo) {
  let div = document.getElementById('ui');
  for (let key in foo)
    addToDiv(div, foo[key]);
}

function addToDiv (div, data) {
  let out = document.createElement ('div');
  let content = document.createTextNode (normalizeFloat(data.percent) + '%');
  let newDiv = document.createElement ('div');
  newDiv.style.backgroundColor = 'rgb(' + data.r + ',' + data.g + ',' + data.b + ')';
  newDiv.style.width = newDiv.style.height = '30px';
  newDiv.style.borderStyle = 'dotted';
  out.appendChild(newDiv);
  out.appendChild(content);
  div.appendChild (out);
}

function normalizeFloat (num) {
  return num.toPrecision (num < 10 ? 2 : 3);
}
