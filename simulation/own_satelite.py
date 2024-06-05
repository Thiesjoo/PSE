from datetime import datetime
import math
import constants


class Satelite:

    line1 = "1 11111U 21111A 21111.11111111 00000-0 00000-0 0 1111"
    line1_size = [1, 5, 1, ]

    # TLE parameters
    def __init__(self, nam):

        # Title line
        self._name = None

        # Line 1
        self.satellite_number = "11111"  # 5 digits
        self.classification = 'U'  # U for unclassified
        self.designation = self.set_designation()
        self.epoch = self.epoch_update()
        self._first_derivative = None  # Not sure what it represents
        self._second_derivative = None
        self._bstar = None
        self._ephemeris_type = None
        self._element_number = None

        # Line 2
        self._inclination = 0
        self._right_ascension = 0
        self._eccentricity = 0  # TODO: Further development: variable e
        self._perigee = 0  # TODO: Understand the variable
        self._mean_anomaly = 0  # TODO: Understand the variable
        self._mean_motion = None
        self._revolution_number = 0  # revolutions since epoch

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
        self._inclination = value

    @property
    def right_ascension(self):
        return self._right_ascension

    @right_ascension.setter
    def right_ascension(self, value):
        if value < 0 or value > 360:
            raise ValueError("Right ascension must be between 0 and 360")
        raad_str = "{:.6f}".format(value)
        self._right_ascension = raad_str

    @property
    def eccentricity(self):
        return self._eccentricity

    @eccentricity.setter
    def eccentricity(self, value):
        if value < 0 or value > 1:
            raise ValueError("Eccentricity must be between 0 and 1")
        e_str = "{:.6f}".format(value)
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

    def calculate_revolution_per_day(self, a):  # a is semi major axis
        mean_motion = math.sqrt(constants.GRAVITATIONAL_PARAM / a ** 3)
        self._mean_motion = mean_motion

    def calculate_orbital_period(self):
        return 1 / self._mean_motion

    def calculate_orbital_velocity(self):
        return math.sqrt(constants.GRAVITATIONAL_PARAM / self._semi_major_axis)

    def produce_TLE(self):
        title_line = f"{self.name}"
        line1 = f"1 {self.satellite_number}{self.classification} {self.designation} {self.epoch} {self._first_derivative} {self._second_derivative} {self._bstar} {self._ephemeris_type} {self._element_number}"
        line2 = f"2 {self.satellite_number} {self._inclination} {self._right_ascension} {self._eccentricity} {self._perigee} {self._mean_anomaly} {self._mean_motion} {self._revolution_number}"
        return line1, line2

satelite = Satelite('ISS')
print('Hello')
satelite.inclination = 51.6
satelite.eccentricity = 0.1
print(satelite.produce_TLE())

def main():
    satelite = Satelite('ISS')
    print(satelite.designation)
