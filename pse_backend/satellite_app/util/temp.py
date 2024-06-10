import csv

with open('country_codes.csv') as file:
    reader = csv.reader(file)
    for row in reader:
        if not row[2]:
            print('No country code found for', row[1])
