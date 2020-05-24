var express = require('express');
var router = express.Router();
var fs = require('fs');
var upload = require('express-fileupload');
var bodyParser = require('body-parser');
var dir = './tmp'
var FTPClient = require('ftp');

let ftpConfig = {
  host: 'www506.your-server.de',
  port: 21,
  user: 'cityem_4',
  password: 'PVAW1k3zyeHUiWvC'
}

router.use(bodyParser.urlencoded({extended: true}))
router.use(upload());

var ftpClient = new FTPClient();

function copyFilesToFtp(sourcePath, destPath, ) {
  ftpClient.on('ready', () => {
    ftpClient.put(sourcePath, destPath, (err) => {
      if (err) throw err;
      ftpClient.end();
    })
  });

  ftpClient.connect(ftpConfig);
}

function copyTest(sourcePath, destPath, ) {
  ftpClient.on('ready', () => {
    ftpClient.put(sourcePath, destPath, (err) => {
      if (err) throw err;
      ftpClient.end();
    })
  });

  ftpClient.connect(ftpConfig);
}

router.get('/', (req, res) => {
  copyTest('./test.txt', '2020/05/test.txt');
  res.end();
})

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

});


// Stolen check
router.post('/check_stolen', (req, res) => {

})

module.exports = router;
