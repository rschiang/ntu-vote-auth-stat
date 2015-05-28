from account.models import *
from core.models import *
from django.conf import settings
from django.utils.timezone import localtime

stations = { station.external_id: station.name for station in Station.objects.all() }
result = { name: [0 for i in range(22)] for name in stations.values() }

for token in AuthToken.objects.all():
    timestamp = localtime(token.timestamp)
    station_name = stations[token.station_id]
    time_index = timestamp.hour * 2 + (1 if timestamp.minute >= 30 else 0) - 17
    result[station_name][time_index] += 1

# Distibution
print('分佈資料：')
summed = { sum(value): key for key, value in result.items() }
for total in sorted(summed.keys(), reverse=True):
    station_name = summed[total]
    print("'%s': %s," % (station_name, str(result[station_name])))

# Accumulated
print('累計資料：')
for total in sorted(summed.keys(), reverse=True):
    station_name = summed[total]
    distri = result[station_name]
    accumu = [sum(distri[:i+1]) for i in range(22)]
    print("'%s': %s," % (station_name, str(accumu)))
