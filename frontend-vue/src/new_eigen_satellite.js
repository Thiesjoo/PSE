export function epochUpdate1() {
    let now = new Date();
    let year = now.getFullYear().toString().slice(-2);
    let start = new Date(now.getFullYear(), 0, 0);
    let diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
    let day = Math.floor(diff / (1000 * 60 * 60 * 24));
    let seconds = now.getSeconds() + now.getMinutes() * 60 + now.getHours() * 3600;
    let day_fraction = (seconds / 86400).toFixed(8).slice(1);

    // Formatting
    return year + (day + parseFloat(day_fraction)).toFixed(8).padStart(12, '0');
}

export function calculateRevolutionPerDay(a) {
    const GRAVITATIONAL_PARAM = 3.986004418e14; // m^3/s^2
    let mean_motion = Math.sqrt(GRAVITATIONAL_PARAM / a ** 3);
    let revolutions_per_day = (mean_motion * 86400) / (2 * Math.PI);
    console.log(revolutions_per_day.toFixed(8))
    return revolutions_per_day.toFixed(8);
}



export class Own_Satellite {
    constructor() {
        this._name = 'New Satellite';
        this.satellite_number = '11111';
        this.classification = 'U';
        this.setDesignation();
        this.epochUpdate();
        this._first_derivative = '-.00000000';
        this._second_derivative = '00000000';
        this._bstar = '00000-0';
        this._ephemeris_type = '0';
        this._element_number = '1111';

        this._inclination = '000.0000';
        this._right_ascension = '000.0000';
        this._eccentricity = '0000000';
        this._perigee = '000.0000';
        this._mean_anomaly = '000.0000';
        this._mean_motion = null;
        this._revolution_number = '00000';
        this._semi_major_axis = 500 * 1000 + 6371 * 1000;
        this.calculateRevolutionPerDay(this._semi_major_axis);
    }

    set name(value) {
        if (value.length > 24) throw new Error('Name is too long');
        this._name = value;
    }

    set inclination(value) {
        if (value < 0 || value > 180) throw new Error('Inclination must be between 0 and 180');
        let inclination_str = value.toFixed(4).padStart(8, '0');
        this.epochUpdate();
        this.resetMeanAnomaly();
        this._inclination = inclination_str;
    }

    set right_ascension(value) {
        if (value < 0 || value > 360) throw new Error('Right ascension must be between 0 and 360');
        let r_ascension_str = value.toFixed(4).padStart(8, '0');
        this.epochUpdate();
        this.resetMeanAnomaly();
        this._right_ascension = r_ascension_str;
    }

    set eccentricity(value) {
        if (value < 0 || value > 1) throw new Error('Eccentricity must be between 0 and 1');
        let e_str = Math.round(value * 10000000)
            .toString()
            .padStart(7, '0');
        this.epochUpdate();
        this.resetMeanAnomaly();
        this._eccentricity = e_str;
    }

    set semi_major_axis(value) {
        console.log(value);
        if (value < 0) throw new Error('Semi major axis must be positive');
        if (value < 160000) throw new Error('Semi major axis is too low for LEO');
        this.epochUpdate();
        // Revolutions per day change with semi-major axis
        this.calculateRevolutionPerDay(value);
        this._semi_major_axis = value;
    }

    setDesignation() {
        let launch_year = new Date().getFullYear().toString().slice(-2);
        let launch_number = '001';
        let launch_piece = 'A  ';
        this.designation = launch_year + launch_number + launch_piece;
    }

    epochUpdate() {
        let now = new Date();
        let year = now.getFullYear().toString().slice(-2);
        let start = new Date(now.getFullYear(), 0, 0);
        let diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
        let day = Math.floor(diff / (1000 * 60 * 60 * 24));
        let seconds = now.getSeconds() + now.getMinutes() * 60 + now.getHours() * 3600;
        let day_fraction = (seconds / 86400).toFixed(8).slice(1);

        // Formatting
        this.epoch = year + (day + parseFloat(day_fraction)).toFixed(8).padStart(12, '0');
    }

    calculateRevolutionPerDay(a) {
        const GRAVITATIONAL_PARAM = 3.986004418e14; // m^3/s^2
        let mean_motion = Math.sqrt(GRAVITATIONAL_PARAM / a ** 3);
        let revolutions_per_day = (mean_motion * 86400) / (2 * Math.PI);
        this._mean_motion = revolutions_per_day.toFixed(8);
    }

    produceTLE() {
        let checksum = '1';
        let title_line = this._name;
        let line1 = `1 ${this.satellite_number}${this.classification} ${this.designation} ${this.epoch} ${this._first_derivative} ${this._second_derivative} ${this._bstar} ${this._ephemeris_type} ${this._element_number} ${checksum}`;
        let line2 = `2 ${this.satellite_number} ${this._inclination} ${this._right_ascension} ${this._eccentricity} ${this._perigee} ${this._mean_anomaly} ${this._mean_motion}${this._revolution_number}${checksum}`;
        let tle = `${title_line}\n${line1}\n${line2}`;
        console.log(tle);
        return tle;
    }

    resetMeanAnomaly() {
        this._mean_anomaly = '000.0000';
    }
}