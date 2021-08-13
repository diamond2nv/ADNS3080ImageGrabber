const serialport = require('serialport')
const Readline = require('@serialport/parser-readline');

/**
 * List available ports
 * select one
 * press start
 * adjust brightness and contrast
 */

const options = {
  baudRate: 115200,
  delimiter: '\n',
  port: COM9
}

// open serial port on COM7
const port = new serialport('COM9', { baudRate: options.baudRate }, function (err) {
  if (err) {
    return console.debug('Error: ', err.message);
  }
})

// port oprn callback
port.on("open", () => {
  console.log('serial port open');
});

// Initialize new parser instance
const parser = port.pipe(new Readline({ delimiter: options.delimiter }));








const process = {};

process.load = function () {
  this.canvas = document.getElementById('process');
  this.ctx = this.canvas.getContext('2d');
  this.motion_canvas = document.getElementById('motion_cardinal');
  this.motion_ctx = this.motion_canvas.getContext('2d');
  this.motion_chart = document.getElementById('motion_chart');
  //this.chart_ctx = this.motion_chart.getContext('2d');

  this.squalOut = document.getElementById('squal');
  this.x = this.y = 0; // instance based x and y


  parser.on('data', data => {
    //console.log('data: ', data);
    process.compute(data)
  });
}

process.compute = function (data) {
  const regex = /-?\d*,-?\d*,-?\d*,-?\d*,-?\d*\[\**(?=\])/g

  if (regex.test((data + ""))) {
    motionProcessing(data);
  } else {
    renderFrame(data);
  }
}


function motionProcessing(data) {
  const motion = {};
  const str = data + "";
  const regex = /-?\d*\.{0,1}\d+/g

  if ((str.match(regex)).length < 5) {
    return console.debug("Error reading motion values from serial"); // remove return so it can fail gracefully
  }

  motion.x = str.match(regex)[0];
  motion.dx = str.match(regex)[1];
  motion.y = str.match(regex)[2];
  motion.dy = str.match(regex)[3];
  motion.squal = str.match(regex)[4];
  //console.log({ 'x': motion.x, 'y': motion.y, 'dx': motion.dx, 'dy': motion.dy, 'squal': motion.squal });
  renderCardinal(motion);
}











function renderFrame(data) {
  var imageX, imageY;
  imageX = imageY = 30;

  const canvas_width = process.motion_canvas.width;
  const canvas_height = process.motion_canvas.height;
  console.log(data);

  //var preimageData = ((data + "").match(/[0-9]{1,3}/g)); // regex match output pixels
  var preimageData = stringToBytes(data);
  console.log(preimageData);


  var pixelLength = preimageData.length;
  if (pixelLength < 900) {
    console.log("incomplete frame");
  }

  // clear canvas before render
  process.motion_ctx.clearRect(0, 0, canvas_width, canvas_height);

  var count = 0;
  for (let i = imageY; i > 0; i--) {
    for (let j = imageX; j > 0; j--) {
      process.ctx.fillStyle = `rgb(${preimageData[count]}, ${preimageData[count]}, ${preimageData[count]})`;
      process.ctx.fillRect(j * 10, i * 10, -10, -10);
      count++
    }
  }
}

function renderCardinal(data) {
  const canvas_width = process.motion_canvas.width;
  const canvas_height = process.motion_canvas.height;

  process.x += parseInt(data.dx);
  process.y += parseInt(data.dy);

  console.log({ 'x': process.x, 'y': process.y });

  process.squalOut.innerText = data.squal;

  // clear canvas before render
  process.motion_ctx.clearRect(0, 0, canvas_width, canvas_height);

  // draw x and y axis
  process.motion_ctx.beginPath();
  process.motion_ctx.moveTo(canvas_width / 2, 0);
  process.motion_ctx.lineTo(canvas_width / 2, canvas_height);
  process.motion_ctx.moveTo(0, canvas_height / 2);
  process.motion_ctx.lineTo(canvas_width, canvas_height / 2);
  process.motion_ctx.stroke();

  process.motion_ctx.beginPath();
  process.motion_ctx.arc(((process.x / 1.5) + (canvas_width / 2)), ((process.y / 1) + (canvas_height / 2)), 10, 0, 2 * Math.PI)
  process.motion_ctx.stroke();
}





function reset_coord() {
  process.x = process.y = 0;
}

// convert a string to individual bytes
function stringToBytes(str) {
  var ch, st, re = [];
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i);  // get char 
    st = [];                 // set up "stack"
    do {
      st.push(ch & 0xFF);  // push byte to stack
      ch = ch >> 8;          // shift value down by 1 byte
    }
    while (ch);
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat(st.reverse());
  }
  // return an array of bytes
  return re;
}