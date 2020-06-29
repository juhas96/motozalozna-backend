exports.mapLoanData = (data, userId) => {
    const loan = {};
    let now = new Date();
    const loan_price = parseInt(data.vysledna_pozicka.toString()) * 100;
    switch(data.dlzka_pozicky.toString()) {
        case '0':
            // Loan for 1 week
            loan.loan_until = new Date().setDate(now.getDate() + 1 * 7);
            break;
        case '1':
            // Loan for 2 weeks
            loan.loan_until = new Date().setDate(now.getDate() + 2 * 7);
            break;
        case '2':
            // Loan for a month
            loan.loan_until = new Date().setDate(now.getDate() + 4 * 7);
            break;
    }

    loan.loan_price = loan_price;
    loan.loan_length = data.dlzka_pozicky.toString();
    loan.interest_paid = false;
    loan.car_bodywork_type = data.karoseria == 0 ? 'Hatchbag / Sedan' : 'Kabrio';
    loan.car_fuel_type = data.palivo == 0 ? 'Benzín' : 'Nafta';
    loan.car_axle_type = data.pohon == 0 ? 'Jednej nápravy' : '4x4';
    loan.car_gearbox_type = data.prevodovka == 0 ? 'Manuálna' : 'Automatická';
    loan.car_power = data.vykon;
    loan.car_years_old = data.vek;
    loan.car_ecv = data.ec.toString();
    loan.car_km = data.pocetkm.toString();
    loan.car_damaged_varnish = data.poskodeny_lak;
    loan.car_damaged_bodywork = data.poskodena_karoseria;
    loan.car_damaged_interior = data.poskodeny_interier;
    loan.car_damaged_window = data.poskodene_sklo;
    loan.car_damaged_axle = data.opotrebena_naprava;
    loan.car_damaged_tires = data.opotrebene_pneu;
    loan.car_price = data.cena;
    loan.userId = userId;
    loan.established_law = data.zalozne_pravo;
    loan.interest = countInterest(loan_price, countInterestPercentage(data.dlzka_pozicky.toString(), data.zalozne_pravo.toString()))
    return loan;
}

const countInterestPercentage = (lengthOfLoan, established_law) => {
    let percentage = 0;
    console.log('LENGTH OF LOAN: ', lengthOfLoan);
    if (established_law === 'true') {
        switch(lengthOfLoan) {
            case '0':
                percentage = 9;
                break;
            case '1':
                percentage = 15;
                break;
            case '2':
                percentage = 19;
                break;
        }
    } else {
        switch(lengthOfLoan) {
            case '0':
                percentage = 3;
                break;
            case '1':
                percentage = 6;
                break;
            case '2':
                percentage = 12;
                break;
        }
    }
    return percentage;
}

const countInterest = (loanPrice, percentage) => {
    console.log('PRICE:', loanPrice);
    console.log('PERCENTAGE:', percentage);
    return (parseInt(percentage) / 100) * parseInt(loanPrice);
}