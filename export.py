from account.models import *
from core.models import *
from django.conf import settings

dataset = []
stations = {}
station_ids = []
college_ids = sorted(settings.COLLEGE_NAMES.keys())

for station in Station.objects.all():
    stations[station.external_id] = station.name
    station_ids.append(station.external_id)

station_ids.sort()

def print_int_list(l):
    return ', '.join([str(i) for i in l])

# Map
for token in AuthToken.objects.all():
    x = token.station_id
    y = token.kind[0]
    dataset.append((x, y))

result = [[0 for y in college_ids] for x in station_ids]

# Reduce
for x, y in dataset:
    result[station_ids.index(x)][college_ids.index(y)] += 1

# Print by stations
print('依票所：')
total = [0 for i in station_ids]
for x in range(len(station_ids)):
    station_id = station_ids[x]
    values = result[x]
    total = [a + b for a, b in zip(total, values)]
    print('"%s": [%s],' % (stations[station_id], print_int_list(values)))

print('"總計": [%s],' % print_int_list(total))

# Print by colleges
print('依學院：')
total = [0 for i in college_ids]
for y in range(len(college_ids)):
    college_id = college_ids[y]
    values = [result[x][y] for x in range(len(station_ids))]
    total = [a + b for a, b in zip(total, values)]
    print('"%s": [%s],' % (settings.COLLEGE_NAMES[college_id], print_int_list(values)))

print('"總計": [%s],' % print_int_list(total))
