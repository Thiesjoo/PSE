from datetime import datetime
import math
import constants


class Satelite:

    # TLE parameters
    def __init__(self, nam):

        # Title line
        self._name = "New Satellite"

        # Line 1
        self.satellite_number = "11111"  # 5 digits
        self.classification = 'U'  # U for unclassified
        self.set_designation()
        self.epoch_update()
        self._first_derivative = "-.00000000"  # 10 symbols
        self._second_derivative = "00000000"  # 8 digits
        self._bstar = "00000-0"  # 7 digits + 1 symbol
        self._ephemeris_type = "0"  # 1 digit
        self._element_number = "1111"  # 4 digits

        # Line 2
        self._inclination = "000.0000"
        self._right_ascension = "000.0000"
        self._eccentricity = "0000000"  # TODO: Further development: variable e
        self._perigee = "000.0000"  # TODO: Understand the variable
        self._mean_anomaly = "000.0000"  # TODO: Understand the variable
        self._mean_motion = None
        self._revolution_number = "00000"  # revolutions since epoch

        self._semi_major_axis = constants.GEO_SEMI_MAJOR_AXIS

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value: str):
        if len(value) > 24:
            raise ValueError("Name is too long")
        self._name = value

    @property
    def inclination(self):
        return self._inclination

    @inclination.setter
    def inclination(self, value):
        if value < 0 or value > 180:
            raise ValueError("Inclination must be between 0 and 180")

        # Ensure 3 digits + 4 decimals
        inclination_str = "{:.4f}".format(value)
        if value < 10:
            inclination_str = "00" + inclination_str
        elif value < 100:
            inclination_str = "0" + inclination_str
        self._inclination = inclination_str

    @property
    def right_ascension(self):
        return self._right_ascension

    @right_ascension.setter
    def right_ascension(self, value):
        if value < 0 or value > 360:
            raise ValueError("Right ascension must be between 0 and 360")

        # Ensure 3 digits + 4 decimals
        r_ascension_str = "{:.4f}".format(value)
        if value < 10:
            r_ascension_str = "00" + r_ascension_str
        elif value < 100:
            r_ascension_str = "0" + r_ascension_str
        self._inclination = r_ascension_str

        self._right_ascension = r_ascension_str

    @property
    def eccentricity(self):
        return self._eccentricity

    @eccentricity.setter
    def eccentricity(self, value):
        if value < 0 or value > 1:
            raise ValueError("Eccentricity must be between 0 and 1")
        e_str = str(int(10 ** 7 * value))
        self._eccentricity = e_str

    @property
    def semi_major_axis(self):
        return self._semi_major_axis

    @semi_major_axis.setter
    def semi_major_axis(self, value):
        if value < 0:
            raise ValueError("Semi major axis must be positive")
        elif value < 160000:
            raise ValueError("Semi major axis is too low for LEO")
        self.calculate_revolution_per_day(value)
        self._semi_major_axis = value

    def set_designation(self):
        # Takes two last digits of the year
        launch_year = str(datetime.now().year)[2:]
        launch_number = "001"
        launch_piece = 'A  '
        self.designation = launch_year + launch_number + launch_piece

    def epoch_update(self):
        now = datetime.now()

        # Takes two last digits of the year
        year = str(now.year)[2:]

        # Get the day of the year
        days = now.date().timetuple().tm_yday  # days
        # Get the fraction of the day
        seconds = now.second + now.minute * 60 + now.hour * 3600
        day_fraction = seconds / 86400

        # Merge
        epoch = year + str(days+day_fraction)[:12]
        self.epoch = epoch

    def calculate_revolution_per_day(self, a):  # a is semi major axis [m]
        mean_motion = math.sqrt(constants.GRAVITATIONAL_PARAM/(a ** 3))  # rad/s
        revolutions_per_day = mean_motion * 86400 / (2 * math.pi)
        self._mean_motion = "{:.8f}".format(revolutions_per_day)

    def calculate_orbital_period(self, a):  # a is semi major axis [m]
        return 86400 / self._mean_motion

    def calculate_orbital_velocity(self):
        return math.sqrt(constants.GRAVITATIONAL_PARAM / self._semi_major_axis)

    def produce_TLE(self):
        checksum = "1"
        title_line = f"{self.name}"
        line1 = f"1 {self.satellite_number}{self.classification} {self.designation} {self.epoch} {self._first_derivative} {self._second_derivative} {self._bstar} {self._ephemeris_type} {self._element_number} {checksum}"
        line2 = f"2 {self.satellite_number} {self._inclination} {self._right_ascension} {self._eccentricity} {self._perigee} {self._mean_anomaly} {self._mean_motion}{self._revolution_number}{checksum}"
        return title_line, line1, line2


def main():
    satelite = Satelite('ISS')
    satelite.inclination = 51.6
    satelite.right_ascension = 45
    satelite.eccentricity = 0.1
    satelite.semi_major_axis = 8000 * 1000
    for line in satelite.produce_TLE():
        print(line)


if __name__ == "__main__":
    main()
