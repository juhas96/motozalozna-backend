var express = require('express');
var router = express.Router();
var fs = require('fs');
var upload = require('express-fileupload');
var bodyParser = require('body-parser');
var dir = './tmp'
var ftp = require('basic-ftp');
var FormData = require('form-data');
const axios = require('axios');
const HTMLParser = require('node-html-parser');
const nodemailer = require("nodemailer");
var multer = require('multer');

let ftpConfig = {
  host: 'www506.your-server.de',
  user: 'cityem_4',
  password: 'PVAW1k3zyeHUiWvC'
}

let storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    callback(null, file.filename + '-' + Date.now());
  }
});

var uploader = multer({storage: storage}).array('photos', 12);

router.use(bodyParser.urlencoded({extended: true}))
router.use(upload());
const htmlFile = fs.readFileSync('routes/cars.txt', 'utf-8');


const client = new ftp.Client();

// router.get('/', (req, res) => {
//   createEmail().then(res => {
//     console.log(res);
//   }).catch((err) => {
//     console.log(err);
//   });
//   res.end();
// })

// router.get('/', (req,res) => {
//   let cars = [];
//   const rootHtml = HTMLParser.parse(htmlFile)
//   const divWithCars = rootHtml.querySelector('#auta');
//   const forms = divWithCars.querySelectorAll('form')
//   for (let i = 0; i < forms.length; i++) {
//     const p = forms[i].querySelector('p');
//     const input = p.querySelector('input');
//     const val = forms[i].querySelectorAll('input');
//     const inputValue = input.getAttribute('value');
//     const car = {};
//     car['model'] = inputValue
//     car['key'] = parseInt(val[1].getAttribute('value'));
//     cars.push(car);
// }
//
//   console.log('CARS:', cars);
//   let json = JSON.stringify(cars);
//   fs.writeFileSync('cars.json', json, 'utf8');
//   res.end();
// });

// File upload
router.post('/upload', (req, res) => {

  // uploader(req, res, (err) => {
  //   if (err) {
  //     return res.send('Error:', err);
  //   }
  //
  //   res.end('File is uploaded');
  // });

  if (req.files) {
    let file = req.files['fileToUpload'];

    // If temporary directory doesnt exists create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    // Create write stream and save file to temp directory
    let personalInfoWriteStream = fs.createWriteStream(dir + '/' + file.name);
    personalInfoWriteStream.write(file.data, 'utf8');
    personalInfoWriteStream.on('error', (e) => {
      console.error('ERROR WITH WRITE STREAM', e);
    });

    personalInfoWriteStream.end();
    personalInfoWriteStream.on('finish', () => {

    // TODO: take username from frontend and create directory in ftp
    // Directory name is from request header
    copyFilesToFtp(dir + `/${file.name}`, '2020/05/' + file.name)
      console.log('Personal Info file saved deleting file');

      // Delete file when is copied to FTP
      fs.unlink(dir + `/${file.name}`, () => {
        console.log('File successfully deleted');
      });
    });
  } else {
    res.send('No files provided');
    res.end();
  }
});

// Price check
router.post('/check_price', (req, res) => {
  console.log('tadyy')
  if (req.body) {
    var bodyFormData = new FormData();
    var carPrice = 0;
    // Map data to FormData
    formDataMapper(bodyFormData, req.body)

    // Call endpoint with data
    axios.post('http://www.institutfinancnejpolitiky.sk/kalkulacky/aut/getprice.php',
      bodyFormData,
      {headers: {'Content-Type': 'multipart/form-data; boundary=' + bodyFormData.getBoundary()}}
    ).then(result => {
      // Parse result
      const root = HTMLParser.parse(result.data);
      const priceResult = root.querySelector('.result1');
      carPrice = priceResult.querySelector('#odometer3').rawText
      res.status(200).send(carPrice);
    }).catch(error => {
      console.log('ERROR: ', error);
    })
  } else {
    res.end();
  }
});


// Stolen check
router.post('/check_stolen', (req, res) => {
  if (req.body) {
    var bodyFormData = new FormData();
    bodyFormData.append('ec', req.body.ecv);

    axios.post('https://www.minv.sk/?odcudzene-mot-vozidla',
      bodyFormData,
      {headers: {'Content-Type': 'multipart/form-data; boundary=' + bodyFormData.getBoundary()}}
    ).then(result => {
      // Parse HTML result
      const root = HTMLParser.parse(result.data);
      const tableWithResult = root.querySelector('.tabulka4');
      const spanWithResult = tableWithResult.querySelector('.tddark');
      var numberOfRecordsString = spanWithResult.firstChild.rawText;
      numberOfRecordsString = numberOfRecordsString.replace(/\D/g, '');

      // If numberOfRecords == 0 car is NOT stolen
      if (numberOfRecordsString == 0) {
        res.status(200).send(numberOfRecordsString);
      } else {
        res.status(403).send(numberOfRecordsString);
      }
    }).catch((err) => {
      console.error(err);
    })
  } else {
    res.end();
  }
})

router.post('/create_pdf', (req, res) => {

})


function formDataMapper(formData, data) {
  formData.append('karoseria', data.karoseria);
  formData.append('palivo', data.palivo);
  formData.append('pohon', data.pohon);
  formData.append('prevodovka', data.prevodovka);
  formData.append('vykon', data.vykon);
  formData.append('vek', data.vek);
  formData.append('pocetkm', data.pocetkm);
  formData.append('dovezene', 0);
  formData.append('auto', data.auto);
}


/**
 * 
 * @param {*} sourcePath - path to file which is copied 
 * @param {*} destPath - destination path for file
 */
async function copyFilesToFtp(sourcePath, destPath, ) {
  client.ftp.verbose = true;
  try {
    await client.access(ftpConfig);
    await client.uploadFrom(sourcePath, destPath);
  } catch (err) {
    console.log(err);
  }
  client.close();
}

// TODO: Handle NS Records
async function createEmail() {
  let transporter = nodemailer.createTransport({
    host: "mail.your-server.de",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'info@motozalozna.sk', // generated ethereal user
      pass: '0455e4V9ZCp7syF8', // generated ethereal password
    },
  });

  // verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Jakub Juhas" <info@motozalozna.sk>', // sender address
    to: "juhas.jugi@gmail.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

function createPDF(title, data, dir) {
  return new Promise(function (resolve, reject) {
    if (!fs.existsSync(dir)) {
      fs.mkdir(dir, { recursive: true }, (error) => {
        if (error) {
          reject(error);
        }
      });
    }
    const doc = new PDFDocument();
    doc.registerFont("Cardo", "fonts/Cardo-Regular.ttf");
    doc.pipe(fs.createWriteStream(dir + "/form.pdf")).on("close", function () {
      resolve();
    });
    doc.font("Cardo").text(title);
    doc.text("-----");
    for (var key in data) {
      if (data.hasOwnProperty(key) && key !== "files") {
        doc.font("Cardo").text(labels[key] + ": " + checkValue(data[key]));
      }
    }
    doc.end();
  });
}

module.exports = router;
