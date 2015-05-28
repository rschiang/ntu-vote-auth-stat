from account.models import *
from core.models import *
from django.conf import settings

dataset = []
keys = sorted(settings.COLLEGE_NAMES.keys())

# Map
for token in AuthToken.objects.all():
    x = token.station_id
    y = token.kind[0]
    dataset.append((x, y))

result = {}

# Reduce
for x, y in dataset:
    x_data = result.get(x, { k : 0 for k in keys })
    y_data = x_data.get(y, 0)
    x_data[y] = y_data + 1
    result[x] = x_data

# Print
stations = { station.external_id: station.name for station in Station.objects.all() }
total = [0 for i in range(len(stations))]
for x, value in result.items():
    values = [value[i] for i in keys]
    entries[sum(values)] = ('"%s": [%s]' % (stations[x], ', '.join([str(i) for i in values])))
