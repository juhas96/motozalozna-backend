const PDFDocument = require('pdfkit')
var fs = require('fs');
const nodemailer = require("nodemailer");
const handlebars = require('handlebars');
const mjml2html = require('mjml')
const Dinero = require('dinero.js');
// require('dotenv').config();

function sendConfirmResetEmail(email, subject) {
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });

  let mailOptions = {
    to: email.toString(),
    from: '"Motozalozna.sk" <info@motozalozna.sk>', // sender address
    subject: subject.toString(),
    text: 'Vaše heslo bolo úspešne zmenené.\n'
  };

  // verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
      transporter.sendMail(mailOptions)
      .then(() => {
        console.log('password change email sended');
      })
      .catch(err => {
        console.log(err);
      })
    }
  });
}

function sendResetEmail(email, subject, token, host) {
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });

  let mailOptions = {
    to: email.toString(),
    from: '"Motozalozna.sk" <info@motozalozna.sk>', // sender address
    subject: subject.toString(),
    text: 'Tento email bol vygenerovaný po požiadavke na obnovu / zmenu hesla pre Váš účet. \n\n' +
        'Pre zmenu hesla kliknite na link alebo ho skopírujte do Vášho internetového prehliadača:\n\n' +
        'https://' + host + '/reset/' + token + '\n\n' +
        'Ak ste požiadavku na zmenu hesla nevytvorili, prosím ignorujte tento email a heslo ostane nezmenené.\n'
  };

  // verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
      
  transporter.sendMail(mailOptions)
    .then(() => {
      console.log('reset email sended');
    })
    .catch(err => {
      console.log(err);
    })
    }
  });
}

/**
 * 
 * @param {*} data 
 * @param {*} subject 
 * @param {*} password
 */
function sendEmail(data, subject, password, attachmentName) {
    // console.log('SENDING EMAIL with data', data);
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER, // generated ethereal user
          pass: process.env.EMAIL_PASSWORD, // generated ethereal password
        },
      });

    const context = {
        firstName: data.krstne_meno.toString(),
        loanNumber: 'GENERATE NUMBER',
        loanDate: new Date().toISOString().split('T')[0],
        priceAsked: Dinero({amount: parseInt(data.vysledna_pozicka.toString()) * 100, currency: 'EUR'}).toFormat(),
        email: data.email.toString(),
        password: password == '' ? 'Pravdepodobne už máte vytvorený účet, heslo nájdete v prvotnom maily.' : password,
    }

    const mjml = template(context);
    const html = mjml2html(mjml);
    
      // verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
    
      // send mail with defined transport object
      let info =  transporter.sendMail({
        from: '"Motozalozna.sk" <info@motozalozna.sk>', // sender address
        to: data.email.toString(), // list of receivers
        subject: subject.toString(), // Subject line
        html: `${html.html}`, // html body
        attachments: [
          {
            filename: 'suhrnZmluvy.pdf',
            path: `./pdfs/${attachmentName}.pdf`
          }
        ]
      }).then(() => {
        console.log('Mail sended');
        // List all files in uploads folder and delete them
        fs.readdir('./pdfs', (err, files) => {
          if (err) {
            console.log(err);
          }
    
          files.forEach((file) => {
            fs.unlinkSync('./pdfs' + `/${file}`, () => {
              console.log('File successfully deleted');
            });
          })
        });
      }).catch(err => console.log(err));
    
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

/**
 * create pdf with specific title, data and directory to save
 * @param {*} title 
 * @param {*} data 
 * @param {*} dir
 * @param {*} filename
 */
function createPdf(data, dirToSave, filename) {
  return new Promise((resolve, reject) => {
     // TODO: Create table
     console.log('CREATING PDF')
     const doc = new PDFDocument;
 
     if (!fs.existsSync(dirToSave)) {
       fs.mkdirSync(dirToSave);
     }
 
     doc.registerFont('Custom Roboto', './fonts/Roboto-Medium.ttf');
 
     doc.pipe(fs.createWriteStream(`${dirToSave}/${filename}.pdf`));
 
     doc.font('Custom Roboto').fontSize(25).text('Žiadosť o pôžičku', {
         align: 'center'
     });
 
     doc.moveDown().font('Custom Roboto').fontSize(18).text('Osobné údaje', {
         align: 'center',
         underline: true
     });
 
     doc.font('Custom Roboto').fontSize(14).text(`Meno: ${data.krstne_meno.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Priezvisko: ${data.priezvisko.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Email: ${data.email.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Tel.číslo: ${data.telefonne_cislo.toString()}`);
 
     doc.moveDown().font('Custom Roboto').fontSize(18).text('Údaje o pôžičke', {
       align: 'center',
       underline: true
     });
 
     doc.font('Custom Roboto').fontSize(14).text(`Dĺžka požičky: ${data.dlzka_pozicky.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Úrok v %: `);
     doc.font('Custom Roboto').fontSize(14).text(`Výška požičky: ${parseInt(data.vysledna_pozicka.toString()) * 100}`);
     doc.font('Custom Roboto').fontSize(14).text(`Úrok v eur: `);
     doc.font('Custom Roboto').fontSize(14).text(`Celková suma na splatenie: `);
     doc.font('Custom Roboto').fontSize(14).text(`Žiadosť podaná dňa: ${new Date().getFullYear()}_`+`${new Date().getMonth()}_`+`${new Date().getDate()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Platnosť do: `);
     doc.font('Custom Roboto').fontSize(14).text(`Záložné právo: ${data.zalozne_pravo.toString()}`);
 
     doc.moveDown().font('Custom Roboto').fontSize(18).text('Údaje o vozidle', {
       align: 'center',
       underline: true
     });
 
     doc.font('Custom Roboto').fontSize(14).text(`Hodnota vozidla: ${data.cena.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Typ karosérie: ${data.karoseria == 0 ? 'Hatchbag / Sedan' : 'Kabrio'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Typ paliva: ${data.palivo == 0 ? 'Benzín' : 'Nafta'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Typ pohonu: ${data.pohon == 0 ? 'Jednej nápravy' : '4x4'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Typ prevodovky: ${data.prevodovka == 0 ? 'Manuálna' : 'Automatická'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Model vozidla: `);
     doc.font('Custom Roboto').fontSize(14).text(`Výkon v KW: ${data.vykon.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Vek vozidla v rokoch: ${data.vek.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Počet najazdených KM: ${data.pocetkm.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`EČV Vozidla: ${data.ec.toString()}`);
     doc.font('Custom Roboto').fontSize(14).text(`Poškodený lak: ${data.poskodeny_lak == 'false' ? 'NIE' : 'ÁNO'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Poškodená karoséria: ${data.poskodena_karoseria == 'false' ? 'NIE' : 'ÁNO'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Poškodený interiér: ${data.poskodeny_interier == 'false' ? 'NIE' : 'ÁNO'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Opotrebená náprava: ${data.opotrebena_naprava == 'false' ? 'NIE' : 'ÁNO'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Opotrebené pneumatiky: ${data.opotrebene_pneu == 'false' ? 'NIE' : 'ÁNO'}`);
     doc.font('Custom Roboto').fontSize(14).text(`Poškodené čelné sklo: ${data.poskodene_sklo == 'false' ? 'NIE' : 'ÁNO'}`);
     doc.end();

     resolve();
  });
   
}

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === '') {
    req.isAuth = false;
    return next();
  }


}


const template = handlebars.compile(`<mjml>
<mj-body background-color="#ccd3e0">
  <mj-section background-color="#fff" padding-bottom="20px" padding-top="20px">
    <mj-column width="100%">
      <mj-text align="center">
          <h1>Motozalozna.sk</h1>
      </mj-text>
    </mj-column>
  </mj-section>
  <mj-section background-color="#E16428" padding-bottom="0px" padding-top="0">
    <mj-column width="100%">
      <mj-text align="center" font-size="30px" color="#FFF" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="18px" padding-top="28px">Ahoj
        <p style="font-size:16px; color:white">{{firstName}}</p>
      </mj-text>
    </mj-column>
  </mj-section>
  <mj-section background-color="#E16428" padding-bottom="5px" padding-top="0">
    <mj-column width="100%">
      <mj-divider border-color="#ffffff" border-width="2px" border-style="solid" padding-left="20px" padding-right="20px" padding-bottom="0px" padding-top="0"></mj-divider>
      <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px">
          <span style="font-size:20px; font-weight:bold">Ďakujeme za vyplnenie formuláru.</span>
          <br/>
          <br/>
          <span>Hneď sa pustíme do jeho spracovania.</span>
          <br/>
          <br/>
          <span style="font-size:15px">Stav si môžeš skontrolovať kliknutím na tlačidlo nižšie</span>
        </mj-text>
    </mj-column>
  </mj-section>
  <mj-section background-color="#E16428" padding-bottom="15px">
    <mj-column>
      <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Číslo žiadosti</strong></mj-text>
      <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">{{loanNumber}}</mj-text>
    </mj-column>
    <mj-column>
      <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px"><strong>Dátum vyplnenia</strong></mj-text>
      <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">{{loanDate}}</mj-text>
    </mj-column>
    <mj-column>
      <mj-text align="center" color="#FFF" font-size="15px" font-family="Ubuntu, Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="0px">
          <strong>Požiadaná čiastka</strong>
      </mj-text>
      <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="10px">
          {{priceAsked}}
      </mj-text>
    </mj-column>
  </mj-section>
      <mj-section background-color="#E16428" padding-bottom="5px" padding-top="0">
    <mj-column width="100%">
      <mj-divider border-color="#ffffff" border-width="2px" border-style="solid" padding-left="20px" padding-right="20px" padding-bottom="0px" padding-top="0"></mj-divider>
      <mj-text align="center" color="#FFF" font-size="13px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="28px" padding-top="28px">
          <span style="font-size:20px; font-weight:bold">Pre prihlásenie do používateľského účtu použite nasledovné údaje:</span>
          </br>
          </br>
          <h2 style="font-size:15px">Email: {{email}}</h2>
           <h2 style="font-size:15px">Heslo: {{password}}</h2>
        </mj-text>
    </mj-column>
  </mj-section>
  <mj-section background-color="#E16428" padding-bottom="20px">
    <mj-column width="50%">
      <mj-button background-color="#FFF" color="black" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="http://motozalozna.sk/panel/" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="10px">Zobraziť žiadosť</mj-button>
    </mj-column>
    <mj-column width="50%">
      <mj-button background-color="#FFF" color="black" font-size="14px" align="center" font-weight="bold" border="none" padding="15px 30px" border-radius="10px" href="http://motozalozna.sk/panel/" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="12px">Zobraziť stav pôžičky</mj-button>
    </mj-column>
  </mj-section>
  <mj-section background-color="#E16428" padding-bottom="5px" padding-top="0">
    <mj-column width="100%">
      <mj-divider border-color="#ffffff" border-width="2px" border-style="solid" padding-left="20px" padding-right="20px" padding-bottom="0px" padding-top="0"></mj-divider>
      <mj-text align="center" color="#FFF" font-size="15px" font-family="Helvetica" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="20px">
          <span style="font-size:15px">Motozalozna.sk</span>
      </mj-text>
    </mj-column>
  </mj-section>
  <mj-section background-color="#FFF"padding-bottom="20px" padding-top="20px">
    <mj-column width="50%" vertical-align="middle">
      <mj-text align="center" font-size="20px" font-weight="bold" padding="0 25px">
        <p>0917 177 222</p>
      </mj-text>
    </mj-column>
    <mj-column width="50%" vertical-align="middle">
      <mj-text align="center" font-size="20px" font-weight="bold" padding="0 25px">
        <p>info@motozalozna.sk</p>
      </mj-text>
    </mj-column>
  </mj-section>
  <!-- <mj-section background-color="#FFF">
      <mj-column vertical-align="middle">
          <mj-social mode="horizontal" padding="30px">
              <mj-social-element name="facebook" href="[[SHORT_PERMALINK]]"></mj-social-element>
               <mj-social-element name="instagram" href="[[SHORT_PERMALINK]]"></mj-social-element>
          </mj-social>
    </mj-column>
  </mj-section> -->
</mj-body>
</mjml>`);

module.exports = {
    sendEmail, createPdf, sendResetEmail, sendConfirmResetEmail
}