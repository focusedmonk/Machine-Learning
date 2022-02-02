import requests
import pandas as pd
import os
pd.set_option('display.max_columns', None)

# Initial Setup
# Create datasets folder
os.system('mkdir datasets')

# Cities to consider for data extraction
city_id = ['134', '5', '4709', '2', '2378', '2423', '3686', '5732', '777', '1692', '6', '132', '6105', '290']
cars_list = []

# Gathering data using Cars24 API
for city in city_id:
    for page in range(1, 125):
        r = requests.get('https://api-sell24.cars24.team/buy-used-car?sort=P&serveWarrantyCount=true&gaId=331146332.1622358282&listingCohortABTest=CONTROL&page=' + str(page) + '&storeCityId=' + city)
        json = r.json()
        cars_list.extend(json['data']['content'])

tv_cars = pd.DataFrame(cars_list)
tv_cars = tv_cars[tv_cars.city != 'Coimbatore']

# Save raw data file
tv_cars.to_csv('datasets/raw.csv', index=False)

cols_to_drop = ['mainImage', 'inspectionMainImage', 'carScores', 'baseUrl', 'calculatedScore', 'storeName', 'ownerName', 'dispositionStatus', 'lmsShareLink', 'parkingYardId', 'sellerBuddyId', 'threeSixtyViewUrl', 'spinCarImageSync', 'spinCarMedia', 'inventoryState', 'storeCityId', 'isFavouriteLms', 'carScores', 'ciChargesApplicable', 'cars24Owned']


# Drop columns that contains sensitive data such as owner name and irrelevant columns such as baseUrl etc.
tv_cars.drop(cols_to_drop, axis=1, inplace=True)

# Standardize the column naming convention
tv_cars.rename(columns={
    'carId': 'id',
    'carName': 'car_name',
    'year': 'yr_mfr',
    'fuelType': 'fuel_type',
    'kilometerDriven': 'kms_run',
    'price': 'sale_price',
    'views': 'times_viewed',
    'bodyType': 'body_type',
    'isC24Assured': 'assured_buy',
    'registrationCity': 'registered_city',
    'registrationState': 'registered_state',
    'isTopSelling': 'is_hot',
    'registrationNumber': 'rto',
    'carSource': 'source',
    'inventoryStatus': 'car_availability',
    'ownerNumber': 'total_owners',
    'c24Quote': 'broker_quote',
    'originalPrice': 'original_price',
    'dealRating': 'car_rating',
    'createdDate': 'ad_created_on',
    'isCFEnabled': 'fitness_certificate',
    'emiStartingValue': 'emi_starts_from',
    'cashDownPayment': 'booking_down_pymnt',
    'warrantyAvailable': 'warranty_avail'
}, inplace=True)

tv_cars.fuel_type = tv_cars.fuel_type.map({
    'Petrol': 'petrol',
    'Diesel': 'diesel',
    'Petrol + CNG': 'petrol & CNG',
    'Petrol + LPG': 'petrol & LPG',
    'Electric': 'electric'
})

tv_cars.source = tv_cars.source.map({
    'GS_CAR': 'inperson_sale',
    'GS_DEALER': 'inperson_sale',
    'CUSTOMER_CARE': 'online',
    'MANUAL_UPLOAD': 'online',
    'C2C_DEALER_CAR': 'customer_to_customer',
    'CLASSIFIED_CAR': 'inperson_sale'
})

tv_cars.car_availability = tv_cars.car_availability.map({
    'STOCK_IN': 'in_stock',
    'IN_TRANSIT': 'in_transit',
    'NEW_CAR': 'in_stock',
    'BID_WON': 'in_stock',
    'PICKUP_REQUEST': 'pickup_pending',
    'STOCK_OUT': 'out_of_stock'
})

# Convering column data to lowercase
tv_cars.variant = tv_cars.variant.str.lower()
tv_cars.fuel_type = tv_cars.fuel_type.str.lower()
tv_cars.car_name = tv_cars.car_name.str.lower()
tv_cars.city = tv_cars.city.str.lower()
tv_cars.body_type = tv_cars.body_type.str.lower()
tv_cars.registered_city = tv_cars.registered_city.str.lower()
tv_cars.registered_state = tv_cars.registered_state.str.lower()
tv_cars.rto = tv_cars.rto.str.lower()
tv_cars.make = tv_cars.make.str.lower()
tv_cars.model = tv_cars.model.str.lower()
tv_cars.car_rating = tv_cars.car_rating.str.lower()
tv_cars.transmission = tv_cars.transmission.str.lower()

# Creating testing samples
test = tv_cars.sample(1000)
tv_cars.drop(index=test.index, inplace=True)

tv_cars.id = list(range(1, len(tv_cars)+1))
test.id = list(range(1, len(test)+1))

# Create training and testing datasets
tv_cars.to_csv('datasets/train.csv', index=False)
test.to_csv('datasets/test.csv', index=False)

# Delete raw dataset which is no longer required
os.remove('datasets/raw.csv')