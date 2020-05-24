var express = require('express');
var router = express.Router();
var fs = require('fs');
var upload = require('express-fileupload');
var bodyParser = require('body-parser');
var dir = './tmp'
var ftp = require('basic-ftp');

let ftpConfig = {
  host: 'www506.your-server.de',
  user: 'cityem_4',
  password: 'PVAW1k3zyeHUiWvC'
}

router.use(bodyParser.urlencoded({extended: true}))
router.use(upload());

const client = new ftp.Client();

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


// File upload just for testing purposes
// async function copyTest(sourcePath, destPath, ) {
//   client.ftp.verbose = true;
//   try {
//     await client.access(ftpConfig);
//     console.log(await client.list());
//     await client.uploadFrom('./routes/META_FINAL.pdf', '2020/05/meta.pdf');
//   } catch (err) {
//     console.log(err);
//   }

//   client.close();
// }

// router.get('/', (req, res) => {
//   copyTest('./test.txt', '2020/05/test.txt');
//   res.end();
// })

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
