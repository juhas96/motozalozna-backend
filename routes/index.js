var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var fs = require('fs');
// var upload = require('express-fileupload');
var bodyParser = require('body-parser');
var dir = './tmp'
var pdfs = './pdfs';
const nodemailer = require("nodemailer");
var multer = require('multer');
const paths = require('path');
const bcrypt = require('bcrypt');
var passwordGenerator = require('generate-password');
const formController = require('../controllers/form.controller');
const utils = require('../utils/utils')
const LoanMapper = require('../mapper/loan.mapper');
const User = require('../models/user.model');
const Loan = require('../models/loan.model');
const Client = require('ftp');
const ftpClient = new Client();
// require('dotenv').config();

let storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    callback(null, file.filedName + '-' + Date.now() + paths.extname(file.originalname));
  }
});

var upload = multer({storage: storage}).array('files', 20);

ftpClient.connect({
   host: process.env.FTP_HOST,
   user: process.env.FTP_USER,
   password: process.env.FTP_PASSWORD
});
ftpClient.on('greeting', (msg) => {
  console.log('FTP: ', msg);
})

ftpClient.on('ready', () => {
  console.log('FTP is ready');
})

ftpClient.on('error', (err) => {
  console.log('FTP ERROR:', err);
})


router.use(bodyParser.urlencoded({extended: true}))

// File upload
router.post('/upload', (req, res) => {
  const now = new Date();
  var form = new multiparty.Form();
  let data;

  // If temporary directory doesn't exists create it
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // Save files to ./tmp directory
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    console.log('Files uploading');
  });

  form.parse(req, (err, fields, files) => {
    if (err) throw err;
    data = fields;

    // PDF Creation
    utils.createPdf(fields, pdfs, `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${data.krstne_meno}_${data.priezvisko}`).then(() => {
      // Password generate
      var password = passwordGenerator.generate({
        length: 10,
        numbers: true
      });

      console.log('PASSSWORD IS: ', password)

      // Find user if not exists create user and assignee userId to new created Loan
      User.findAll({where :{email: data.email.toString()}}).then(oldUser => {
        if (oldUser.length <= 0) {
          utils.sendEmail(data, 'Nova pozicka', password, `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${data.krstne_meno}_${data.priezvisko}`);
          User.create({
            first_name: data.krstne_meno.toString(),
            last_name: data.priezvisko.toString(),
            email: data.email.toString(),
            password: bcrypt.hashSync(password, 10),
            phone_number: data.telefonne_cislo.toString()
          }).then(user => {
            Loan.create(LoanMapper.mapLoanData(data, user.id))
              .then(loan => {
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
          utils.sendEmail(data, 'Nova pozicka', password, `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${data.krstne_meno}_${data.priezvisko}`);
          Loan.create(LoanMapper.mapLoanData(data, oldUser[0].id))
            .then(loan => {
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

      copyFilesViaFtp(data);
    });
  })
});

// Price check
router.post('/check_price', formController.checkPrice);

// Stolen check
router.post('/check_stolen', formController.checkStolen);

async function copyFilesViaFtp(data) {
  const now = new Date();
  // File should have name ex: 2020_07_1_Jakub_Juhas
  ftpClient.mkdir(`${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${data.krstne_meno}_${data.priezvisko}`,true, ((error) => {
    const destPath = `${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${data.krstne_meno}_${data.priezvisko}`;
    if (error) {
      console.log(error);
    }
    // List all files in tmp folder and upload them
    fs.readdir(dir, (err, files) => {
      if (err) {
        console.log(err);
      }

      files.forEach((file) => {
        ftpClient.put(`${dir}` + `/${file}`, `${destPath}` + `/${file}`, (err) => {
          if (err) throw err;
          // Delete file when is copied to FTP
          fs.unlink(dir + `/${file}`, () => {
            console.log('Image successfully deleted');
          });
        });
      })
    });

    // List all files in uploads folder and delete them
    fs.readdir(pdfs, (err, files) => {
      if (err) {
        console.log(err);
      }

      files.forEach((file) => {
        ftpClient.put(`${pdfs}` + `/${file}`, `${destPath}` + `/${file}`, (err) => {
          if (err) throw err;
        });
      })
    });
  }));
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
