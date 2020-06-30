var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var fs = require('fs');
// var upload = require('express-fileupload');
var bodyParser = require('body-parser');
var dir = './tmp'
var ftp = require('basic-ftp');
var FormData = require('form-data');
const axios = require('axios');
const HTMLParser = require('node-html-parser');
// require('dotenv').config();
const nodemailer = require("nodemailer");
var multer = require('multer');
const PDFDocument = require('pdfkit')
const paths = require('path');
const bcrypt = require('bcrypt');
var passwordGenerator = require('generate-password');

// TODO: refactor whole file to more classes

const LoanMapper = require('../mapper/loan.mapper');
const User = require('../models/user.model');
const Loan = require('../models/loan.model');

let storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    callback(null, file.filedName + '-' + Date.now() + paths.extname(file.originalname));
  }
});

var upload = multer({storage: storage}).array('files', 20);

router.use(bodyParser.urlencoded({extended: true}))
const client = new ftp.Client();

// File upload
router.post('/upload', (req, res) => {
  let files = req.files;
  var form = new multiparty.Form();
  let data;
  form.parse(req, (err, fields, files) => {
    createPDF('New PDF', fields, '../pdfs');
    data = fields;
    console.log('FIELDS:' , fields);
    var password = passwordGenerator.generate({
      length: 10,
      numbers: true
    });

    console.log('PASSSWORD IS: ', password)

    // Find user if not exists create user and assignee userId to new created Loan
    let user;
    User.findAll({where :{email: data.email.toString()}}).then(oldUser => {
      console.log('OLD USER: ', oldUser)
      if (oldUser.length <= 0) {
        createEmail(password);
        User.create({
          first_name: data.krstne_meno.toString(),
          last_name: data.priezvisko.toString(),
          email: data.email.toString(),
          password: bcrypt.hashSync(password, 10),
          phone_number: data.telefonne_cislo.toString()
        }).then(user => {
          Loan.create(LoanMapper.mapLoanData(data, user.id))
            .then(loan => {
              console.log(loan);
              res.json(loan);
            })
            .catch(err => {
              console.log(err);
              res.status(500).send(err);
            });
        }).catch(err => {
          console.log(err);
          res.status(500).send(err);
        })
      } else {
        Loan.create(LoanMapper.mapLoanData(data, oldUser[0].id))
          .then(loan => {
            console.log(loan);
            res.json(loan);
          })
          .catch(err => {
            console.log(err);
            res.status(500).send(err);
          });
      }
    }).catch(err => {
      console.log(err);
      res.status(500).send(err);
    });
  
    
  })

  // If temporary directory doesn't exists create it
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // upload(req, res, (err) => {
  //   if (err instanceof multer.MulterError) {
  //     return res.status(500).json(err);
  //   } else if (err) {
  //     return res.status(500).json(err);
  //   }
  //   // return res.status(200).send('Success!');
  // });

  //TODO: copyFilesViaFtp and delete all uploaded files

});

//     // TODO: take username from frontend and create directory in ftp
//     // Directory name is from request header
//     copyFilesToFtp(dir + `/${file.name}`, '2020/05/' + file.name)
//       console.log('Personal Info file saved deleting file');

//       // Delete file when is copied to FTP
//       fs.unlink(dir + `/${file.name}`, () => {
//         console.log('File successfully deleted');
//       });
//     });

// Price check
router.post('/check_price', (req, res) => {
  if (req.body) {
    var bodyFormData = new FormData();
    var carPrice = 0;
    // Map data to FormData
    priceFormDataMapper(bodyFormData, req.body)

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

/**
 * 
 * @param {*} sourcePath - path to file which is copied 
 * @param {*} destPath - destination path for file
 */
async function copyFilesToFtp(sourcePath, destPath, ) {
  client.ftp.verbose = true;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    });
    await client.uploadFrom(sourcePath, destPath);
  } catch (err) {
    console.log(err);
  }
  client.close();
}

async function createEmail(data, subject, html, mailTo) {
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
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
    from: '"Motozalozna.sk" <info@motozalozna.sk>', // sender address
    to: mailTo.toString(), // list of receivers
    subject: subject.toString(), // Subject line
    html: html, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

function createPDF(title, data, dir) {
    // TODO: create DIR if not exists
    console.log('CREATING PDF')
    const doc = new PDFDocument;
    doc.pipe(fs.createWriteStream("form.pdf"));
    // draw some text
    // draw some text
    doc.font('Times-Bold').fontSize(25).text('Žiadost o požicku', {
        align: 'center'
    });

    doc.moveDown().font('Times-Bold').fontSize(18).text('Osobné údaje', {
        align: 'center',
        underline: true
    });

    doc.font('Times-Bold').fontSize(14).text('Meno: ');
    doc.font('Times-Bold').fontSize(14).text('Priezvisko: ');
    doc.font('Times-Bold').fontSize(14).text('Email: ');
    doc.font('Times-Bold').fontSize(14).text('Tel.číslo: ');

    doc.moveDown().font('Times-Bold').fontSize(18).text('Údaje o požicke', {
      align: 'center',
      underline: true
    });

    doc.font('Times-Bold').fontSize(14).text('Dĺžka požicky: ');
    doc.font('Times-Bold').fontSize(14).text('Úrok v %: ');
    doc.font('Times-Bold').fontSize(14).text('Výška požičky: ');
    doc.font('Times-Bold').fontSize(14).text('Úrok v eur: ');
    doc.font('Times-Bold').fontSize(14).text('Celková suma na splatenie: ');
    doc.font('Times-Bold').fontSize(14).text('Žiadosť podaná dňa: ');
    doc.font('Times-Bold').fontSize(14).text('Platnosť do: ');
    doc.font('Times-Bold').fontSize(14).text('Záložné právo: ');

    doc.moveDown().font('Times-Bold').fontSize(18).text('Údaje o vozidle', {
      align: 'center',
      underline: true
    });

    doc.font('Times-Bold').fontSize(14).text('Hodnota vozidla: ');
    doc.font('Times-Bold').fontSize(14).text('Typ karosérie: ');
    doc.font('Times-Bold').fontSize(14).text('Typ paliva: ');
    doc.font('Times-Bold').fontSize(14).text('Typ pohonu: ');
    doc.font('Times-Bold').fontSize(14).text('Typ prevodovky: ');
    doc.font('Times-Bold').fontSize(14).text('Model vozidla: ');
    doc.font('Times-Bold').fontSize(14).text('Výkon v KW: ');
    doc.font('Times-Bold').fontSize(14).text('Vek vozidla v rokoch: ');
    doc.font('Times-Bold').fontSize(14).text('Počet najazdených KM: ');
    doc.font('Times-Bold').fontSize(14).text('EČV Vozidla: ');
    doc.font('Times-Bold').fontSize(14).text('Poškodený lak: ');
    doc.font('Times-Bold').fontSize(14).text('Poškodená karoséria: ');
    doc.font('Times-Bold').fontSize(14).text('Poškodený interiér: ');
    doc.font('Times-Bold').fontSize(14).text('Opotrebená náprava: ');
    doc.font('Times-Bold').fontSize(14).text('Opotrebené pneumatiky: ');
    doc.font('Times-Bold').fontSize(14).text('Poškodené čelné sklo: ');
    doc.end();
}

/**
 * Returns mapped data to FORM-Data for check price API request
 * @param {*} formData - formData for CheckPrice request 
 * @param {*} data - data from request
 */
function priceFormDataMapper(formData, data) {
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

module.exports = router;







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
