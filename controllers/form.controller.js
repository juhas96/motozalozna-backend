var FormData = require('form-data');
const axios = require('axios');
const HTMLParser = require('node-html-parser');

/**
 * returns estimated price of car based on user data
 */
exports.checkPrice = (req, res) => {
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
          res.status(500).send({
              message: err
          });
        })
      } else {
        res.end();
      }
}

exports.checkStolen = (req, res) => {
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