import json, os
from pathlib import Path
from Utils import *

cwd = os.getcwd()
root_path = Path(cwd).parent
data_path = Path.joinpath(root_path, 'data')

config_settings_file = '../Settings.json'
settings_json = read_json_file(config_settings_file)
settings_json['ExcelData'] = str(Path.joinpath(data_path, 'excel_filename.xlsx'))
settings_json['TrainingInputPath'] = str(Path.joinpath(data_path, 'Train_'))
settings_json['TrainingOutputPath'] = str(data_path)
with open(config_settings_file, 'w') as f:
    f.write(json.dumps(settings_json, indent=4))

ui_config_settings_file = '../UI Tool/configuration/settings.json'
ui_settings_json = read_json_file(ui_config_settings_file)
ui_settings_json['LocalAppDirectory'] = str(Path.joinpath(root_path, 'NLP', 'index.html'))
with open(ui_config_settings_file, 'w') as f:
    f.write(json.dumps(ui_settings_json, indent=4))