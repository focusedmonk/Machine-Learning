import json
print(__name__)
def read_json_file(filepath):
    file = open(filepath, 'r')
    data = json.load(file)
    file.close()
    return data