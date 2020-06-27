exports.mapLoanData = (data, userId) => {
    const loan = {};
    loan.loan_until = new Date();
    loan.loan_price = data.vysledna_pozicka;
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
    loan.interest = data.vysledna_pozicka;
    return loan;
}