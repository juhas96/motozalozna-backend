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

let ftpConfig = {
  host: 'www506.your-server.de',
  user: 'cityem_4',
  password: 'PVAW1k3zyeHUiWvC'
}

router.use(bodyParser.urlencoded({extended: true}))
router.use(upload());

const client = new ftp.Client();

// File upload
router.post('/upload', (req, res) => {
  if (req.files) {
    let personalInfoFile = req.files['personalInfoFile'];

    // If temporary directory doesnt exists create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    // Create write stream and save file to temp directory
    let personalInfoWriteStream = fs.createWriteStream(dir + '/' + personalInfoFile.name);
    personalInfoWriteStream.write(personalInfoFile.data, 'utf8');
    personalInfoWriteStream.on('error', (e) => {
      console.error('ERROR WITH WRITE STREAM', e);
    });

    personalInfoWriteStream.end();
    personalInfoWriteStream.on('finish', () => {

    // TODO: create dir with name
    copyFilesToFtp(dir + `/${personalInfoFile.name}`, '2020/05/' + personalInfoFile.name)
      console.log('Personal Info file saved deleting file');

      // Delete file when is copied to FTP
      fs.unlink(dir + `/${personalInfoFile.name}`, () => {
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
  formData.append('dovezene', data.dovezene);
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

function checkIfCarIsStolen(ecv) {
  var bodyFormData = new FormData();
  bodyFormData.append('ec', ecv);

  axios.post('https://www.minv.sk/?odcudzene-mot-vozidla',
    bodyFormData,
    {headers: {'Content-Type': 'multipart/form-data; boundary=' + bodyFormData.getBoundary()}}
  ).then(result => {
    const root = HTMLParser.parse(result.data);
    const tableWithResult = root.querySelector('.tabulka4');
    const spanWithResult = tableWithResult.querySelector('.tddark');
    var numberOfRecordsString = spanWithResult.firstChild.rawText;
    numberOfRecordsString = numberOfRecordsString.replace(/\D/g, '');
    return numberOfRecordsString;
  }).catch((err) => {
    console.error(err);
  })
}

module.exports = router;
