export function epochUpdate() {
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